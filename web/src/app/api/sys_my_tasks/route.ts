import { GET as tasksGET, POST as tasksPOST, PATCH as tasksPATCH, DELETE as tasksDELETE } from '../tasks/route';

export async function GET(request: Request) {
  return tasksGET(request);
}

export async function POST(request: Request) {
  return tasksPOST(request);
}

export async function PATCH(request: Request) {
  return tasksPATCH(request);
}

export async function DELETE(request: Request) {
  return tasksDELETE(request);
}
