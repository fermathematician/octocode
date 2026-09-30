import { AppError } from "../../../shared/appError.js";
import { toUserDto, type UserDto } from "../../../shared/presenters.js";
import type { UserRepository } from "../repositories/UserRepository.js";

export class GetCurrentUserService {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return toUserDto(user);
  }
}
