//this is using the Promises by resolving the promise and then performing the error
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}
//this is using try-catch method by wrapping the async function
//const asyncHandler = (fn) => async (req, res, next) => {
//    try {
//        await fn(req, res, next)
//    } catch (err) {
//        res.status(err.code || 500).json({
//            success: false,
//            message: err.message
//        })
//    }
//}

export { asyncHandler }