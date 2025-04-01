import jwt from "jsonwebtoken";
import { ENV } from "../config/env";


const generateToken = ( user: {id : string; role : string}): string => {
    return jwt.sign({ id: user.id, role: user.role}, ENV.JWT_SECRET, {
        expiresIn: "1d",
    })
};

export default generateToken;