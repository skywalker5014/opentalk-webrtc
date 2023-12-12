import jwt from 'jsonwebtoken';

export default function authenticate(req, res, next){
    if(!req.headers.authorization){
        res.status(403).json('no autherization token found')
    } else {
        const token = req.headers.authorization; 
        try {
            
        } catch (error) {
            res.status(403).json('token expired. relogin')
        }
    }
}