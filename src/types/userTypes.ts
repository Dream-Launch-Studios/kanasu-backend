export interface User {
    id : string;
    email : string;
    password : string;
    role : "ADMIN" | "REGIONAL_COORDINATOR"
}