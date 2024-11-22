module.exports = (url) => {
    // https://res.cloudinary.com/dvrgra6z8/image/upload/v1728307525/1728307524358_827.3168609627712.jpg
    const pattern = /\/v\d+\/(.+)\.[a-z]+$/;
    const match = url.match(pattern)
    console.log(match)
    return match[1]
}