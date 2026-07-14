import type { AuthGateway } from "../ports/auth-gateway";
import type { SignInInput } from "../dto";

export class SignIn {
  constructor(private readonly auth: AuthGateway) {}

  async execute(input: SignInInput): Promise<void> {
    await this.auth.signInWithPassword(input.email, input.password);
  }
}
