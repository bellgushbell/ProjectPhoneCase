module.exports = (func) => {
    return (req, res, next) => func(req, res, next).catch(err => next(err)) //ย่อ try catch
}

// one line module.exports = (func) = (req,res,next) => func(req,res,next).catch(next)