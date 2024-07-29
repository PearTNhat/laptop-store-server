export const errorResponseHandler = (err, req, res, next) => {
    // nếu có thêm tham số err (4 tham số) thì  khi nào dùng next(err) thì nó sẽ vào 4 tham số
    // next() là chạy vào middelware tiếp theo
    console.log(err.stack);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : null,
    });
  };
export const invalidPathHandler = (req, res, next) => {
    // Bởi vì k có res nào bắt path sai hết nên nó lại vào đây
    // nếu có thêm tham số err (4 tham số) thì  khi nào dùng next(err) thì nó sẽ vào 4 tham số
    // next() là chạy vào middelware tiếp theo
    const error = new Error("Invalid path");
    error.statusCode = 404;
    // đưa vào errorResponseHandler
    next(error);
  };
  