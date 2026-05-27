export class ApiResponseHelper {
  static success<T>(data: T, message = "Success", statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
    };
  }

  static error(message: string, statusCode = 400) {
    return {
      success: false,
      statusCode,
      message,
      data: null,
    };
  }
}