const notFoundHandler = (req,res) =>{
    res.status(404).json({message:"path not found on this server"})
}

module.exports = notFoundHandler