import { logoutRoute } from "../../../../backend/src/routes/logout.route";

export async function POST() {
    return logoutRoute();
}