
function validateImage(file, cb){
    fileToBase64(file, (err, b64) => {
        if(err){
            cb(err)
        } else {
            const image = new Image(), err = () => {
                cb('Invalid image.')
            }
            image.onload = () => {
                if(image.width){
                    cb(null, file)
                } else {
                    err()
                }
                image.src = null
            }
            image.onerror = err
            image.src = b64
        }
    })
}

const exec = require('child_process').exec, minimizeCommands = {
    win32: 'powershell -command "(new-object -com shell.application).minimizeall()"',
    linux: 'wmctrl -k on;xdotool key super+d'
}

function focusDesktop(cb){
    if(typeof(minimizeCommands[process.platform]) != 'undefined'){
        win.on('minimize', win.restore)
        exec(minimizeCommands[process.platform], (error, stdOut, stdErr) => {
            win.removeListener('minimize', win.restore)
            if(typeof(cb) == 'function'){
                cb(error)
            }
        })
    } else {
        if(typeof(cb) == 'function'){
            cb(new Error('Platform not supported'))
        }
    }
}