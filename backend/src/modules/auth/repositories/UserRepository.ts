import type {
  PrismaClient,
  User,
} from "../../../generated/prisma/client.js";

export interface UserProfileData {
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  create(data: UserProfileData): Promise<User>;
  updateProfile(id: string, data: UserProfileData): Promise<User>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByLogin(login: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { login } });
  }

  create(data: UserProfileData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  updateProfile(id: string, data: UserProfileData): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
