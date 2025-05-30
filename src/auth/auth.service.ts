import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {

    signin(dto: AuthDto){
        return'qqqq'
    }

    signup(dto: AuthDto){
        
    }

}
