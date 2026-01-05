import { UserStatus } from "../../common/definitions/UserStatus";


export type RegisterUserResponse = {
  message: string;
  userId: number;
  status: UserStatus;
};
