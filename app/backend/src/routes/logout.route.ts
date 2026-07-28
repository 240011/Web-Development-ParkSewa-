import { LogoutController } from "../controllers/logout.controller";

const logoutController = new LogoutController();

export async function logoutRoute() {
  return logoutController.logout();
}
