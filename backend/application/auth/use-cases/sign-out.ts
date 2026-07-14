import type { AuthGateway } from "../ports/auth-gateway";

export class SignOut {
  constructor(private readonly auth: AuthGateway) {}

  async execute(): Promise<void> {
    await this.auth.signOut();
  }
}
