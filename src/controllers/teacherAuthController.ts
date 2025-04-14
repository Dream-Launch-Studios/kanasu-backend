import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { sendSMS } from "../utils/smsService";

// Store OTPs in memory for development mode (will be lost on server restart)
const devModeOtps: Record<string, { otp: string; expires: Date }> = {};

// Function to generate a random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate token specifically for teachers with anganwadi information
const generateTeacherToken = (teacher: {
  id: string;
  anganwadiId?: string | null;
}): string => {
  return jwt.sign(
    {
      id: teacher.id,
      role: "TEACHER",
      anganwadiId: teacher.anganwadiId || null,
    },
    ENV.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Request OTP for login
export const requestOTP = async (
  req: Request<{}, {}, { phone: string }>,
  res: Response,
  next: NextFunction
) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    // First check if teacher with given phone exists in our database
    const teacher = await prisma.teacher.findUnique({
      where: { phone },
      include: {
        anganwadi: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({
        error: "No teacher found with this phone number",
      });
    }

    // Check if teacher is assigned to an anganwadi
    if (!teacher.anganwadiId) {
      return res.status(400).json({
        error:
          "Teacher is not assigned to any anganwadi. Please contact administrator.",
      });
    }

    // Generate OTP and set expiry (10 minutes from now)
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    // For development mode: save OTP in memory
    if (process.env.NODE_ENV !== "production") {
      devModeOtps[phone] = { otp, expires: otpExpiry };
      console.log(`[DEV MODE] Generated OTP for ${phone}: ${otp}`);

      // Mark in our database that OTP was requested
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { isVerified: false },
      });

      return res.status(200).json({
        message: "DEV MODE: OTP generated locally",
        otp, // Return OTP in development mode only
        phoneNumber: phone,
        expiresAt: otpExpiry,
      });
    } else {
      // In production, use AWS SNS to send the OTP
      try {
        const message = `Your Kanasu login OTP is: ${otp}. It will expire in 10 minutes.`;
        await sendSMS(phone, message);

        console.log(`SMS with OTP sent to ${phone}`);

        // Mark in our database that OTP was requested
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { isVerified: false },
        });

        // Also save OTP in our dev storage for verification
        devModeOtps[phone] = { otp, expires: otpExpiry };

        return res.status(200).json({
          message: "OTP has been sent to your phone number",
          phoneNumber: phone,
          // Include OTP in testing - remove this in final production
          otp: process.env.TESTING === "true" ? otp : undefined,
        });
      } catch (smsError) {
        console.error("Failed to send SMS:", smsError);
        return res.status(500).json({
          error: "Failed to send OTP via SMS. Please try again later.",
        });
      }
    }
  } catch (error) {
    console.error("Error generating OTP:", error);
    return next(error);
  }
};

// Verify OTP and login
export const verifyOTP = async (
  req: Request<{}, {}, { phone: string; otp: string }>,
  res: Response,
  next: NextFunction
) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone number and OTP are required" });
  }

  try {
    // Find teacher in our database with anganwadi information
    const teacher = await prisma.teacher.findUnique({
      where: { phone },
      include: {
        anganwadi: {
          select: {
            id: true,
            name: true,
            location: true,
            district: true,
            state: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    if (!teacher.anganwadiId) {
      return res.status(400).json({
        error:
          "Teacher is not assigned to any anganwadi. Please contact administrator.",
      });
    }

    let isValidOtp = false;

    // For development mode: verify OTP from memory
    if (process.env.NODE_ENV !== "production") {
      const savedOtp = devModeOtps[phone];

      if (!savedOtp) {
        console.log(`[DEV MODE] No OTP found for ${phone}, accepting any OTP`);
        isValidOtp = true; // In dev mode, accept any OTP if none is stored
      } else if (savedOtp.expires < new Date()) {
        console.log(
          `[DEV MODE] OTP expired for ${phone}, but accepting it anyway`
        );
        isValidOtp = true; // In dev mode, accept expired OTPs too
      } else if (savedOtp.otp === otp) {
        console.log(`[DEV MODE] Valid OTP for ${phone}`);
        isValidOtp = true;
      } else {
        console.log(
          `[DEV MODE] Invalid OTP for ${phone}, but accepting it anyway`
        );
        isValidOtp = true; // In dev mode, accept any OTP for easier testing
      }

      // Clean up the saved OTP
      delete devModeOtps[phone];
    } else {
      // In production mode, we still verify using our temprary in-memory storage
      // In a real production app, this should be replaced with a database-backed solution
      const savedOtp = devModeOtps[phone];

      if (!savedOtp) {
        console.log(`[PRODUCTION] No OTP found for ${phone}`);
        isValidOtp = false;
      } else if (savedOtp.expires < new Date()) {
        console.log(`[PRODUCTION] OTP expired for ${phone}`);
        isValidOtp = false;
      } else if (savedOtp.otp === otp) {
        console.log(`[PRODUCTION] Valid OTP for ${phone}`);
        isValidOtp = true;
      } else {
        console.log(`[PRODUCTION] Invalid OTP for ${phone}`);
        isValidOtp = false;
      }

      // Clean up the saved OTP
      delete devModeOtps[phone];
    }

    if (!isValidOtp) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // OTP verified, mark as verified in our database
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { isVerified: true },
    });

    // Generate JWT token for our application including anganwadi info
    const token = generateTeacherToken(teacher);

    // Return teacher data and token with anganwadi information
    return res.status(200).json({
      message: "Login successful",
      token,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        phone: teacher.phone,
      },
      anganwadi: teacher.anganwadi,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return next(error);
  }
};

// Get teacher profile with anganwadi information
export const getTeacherProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const teacherId = req.user?.id;
    const anganwadiId = (req.user as any)?.anganwadiId;

    if (!teacherId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get teacher information with anganwadi details
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        phone: true,
        anganwadi: {
          select: {
            id: true,
            name: true,
            location: true,
            district: true,
            state: true,
            students: {
              select: {
                id: true,
                name: true,
                gender: true,
                status: true,
              },
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    if (!teacher.anganwadi) {
      return res.status(400).json({
        error:
          "Teacher is not assigned to any anganwadi. Please contact administrator.",
      });
    }

    // Include anganwadi-specific information in the response
    return res.status(200).json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        phone: teacher.phone,
      },
      anganwadi: teacher.anganwadi,
    });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return next(error);
  }
};

// Get anganwadi details
export const getAnganwadiDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get anganwadiId from authenticated user
    const anganwadiId = req.user?.anganwadiId;

    if (!anganwadiId) {
      return res.status(400).json({
        error: "No anganwadi associated with this account",
      });
    }

    // Get detailed information about the anganwadi
    const anganwadi = await prisma.anganwadi.findUnique({
      where: { id: anganwadiId },
      select: {
        id: true,
        name: true,
        location: true,
        district: true,
        state: true,
        students: {
          select: {
            id: true,
            name: true,
            gender: true,
            status: true,
            evaluations: {
              select: {
                id: true,
                weekNumber: true,
                createdAt: true,
                submittedAt: true,
                gradingComplete: true,
                status: true,
                topic: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 5,
            },
          },
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            name: "asc",
          },
        },
        // Include recent assessments for this anganwadi
        anganwadiAssessments: {
          select: {
            id: true,
            isComplete: true,
            completedStudentCount: true,
            totalStudentCount: true,
            assessmentSession: {
              select: {
                id: true,
                name: true,
                description: true,
                startDate: true,
                endDate: true,
                isActive: true,
                status: true,
              },
            },
          },
          where: {
            assessmentSession: {
              isActive: true,
            },
          },
          orderBy: {
            assessmentSession: {
              startDate: "desc",
            },
          },
          take: 5,
        },
      },
    });

    if (!anganwadi) {
      return res.status(404).json({
        error: "Anganwadi not found",
      });
    }

    return res.status(200).json({ anganwadi });
  } catch (error) {
    console.error("Error fetching anganwadi details:", error);
    return next(error);
  }
};
