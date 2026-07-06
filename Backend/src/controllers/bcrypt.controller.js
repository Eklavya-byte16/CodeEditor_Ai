// hash password
// comparepass
// validatepasswordstrenth
// sanitizepass
import bcrypt from 'bcrypt'

export const hashPassword = async (plainPassword) =>{

    const saltRounds = 10;
    try {
        const hashedPassword =await bcrypt.hash(plainPassword, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error(`password failed to hash: ${error.message}`);
        
    }
}

export const comparePassword = async (plainPassword,hashedPassword) => {
    try {
        const isMatch= await bcrypt.compare(plainPassword,hashedPassword);
        return isMatch
    } catch (error) {
        throw new Error(`password failed to comparePassword: ${error.message}`);
        
    }
}

export const validatePasswordStrenth = (password) =>{
    const errors = [];

    if (password.length < 8) {
        errors.push('password must be at least 8 char');
    }
    if(!/[A-Z]/.test(password)){
        errors.push('password must have 1 uppercase');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('password must have at least 1 lowercase')
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('password must have 1 special char')
    }

    return{
        isValid: errors.length === 0,
        errors
    }
}


export const sanitizePassword = (password)=>{

    if (!password || typeof password !== 'string') {
        throw new Error('password must be an non-empty string');
    }
    const trimmed = password.trim();
    if (trimmed.length === 0 ) {
        throw new Error('password cant be empty or whitespace');
        
    }

    return trimmed;
}


export default{
    sanitizePassword,
    validatePasswordStrenth,
    comparePassword,
    hashPassword
}