import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { LoginAttempt } from './login-attempt.entity';

@Entity('sessions')
export class Session {
  @PrimaryColumn()
  uuid: string;

  @Column()
  ip: string;

  @Column()
  country: string;

  @Column()
  sensor: string;

  @OneToMany(() => LoginAttempt, (loginAttempt) => loginAttempt.session)
  loginAttempts: LoginAttempt[];
}
