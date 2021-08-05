// Imagemagick library (WebAssembly)
////import * as Magick from 'https://knicknic.github.io/wasm-imagemagick/magickApi.js';
import * as Magick from '../lib/wasm-imagemagick/magickApi.js';

// gif-info library (https://github.com/Prinzhorn/gif-info)
import getInfo from '../lib/gif-info/gif-info.js';



/* ------------------------------------------------------------------------- */
/*                                 Functions                                 */
/* ------------------------------------------------------------------------- */

/**
 * @param {ArrayBuffer} imageArrayBuffer GIF's image array buffer
 * @returns {object} Files, PNG images of the GIF's grame
 * @note https://gangmax.me/blog/2020/08/13/wasm-imagemagick/
 */
const extractFrames = async imageArrayBuffer => {
    // Extract the byte array of the image
    const sourceBytes = new Uint8Array(imageArrayBuffer.slice(0)); // 'slice(0)' because Magick will empty the ArrayBuffer

    // Define the file and the command for Image Magick
    const files = [{ name: 'source.gif', content: sourceBytes }];
    const command = ['convert', '-coalesce', 'source.gif', 'out%05d.png'];

    return await Magick.Call(files, command);
};



/**
 * Creates a GIF from multiple PNG frames.
 * @param {Array.<{content: ArrayBuffer, delay: number}>} frames GIF frames as PNG images
 * @returns {object} GIF
 * @note https://stackoverflow.com/questions/18197253/imagemagick-convert-individual-frame-delay-in-gif
 */
const createGIF = async frames => {
    let files = [];
    let commandDelays = [];

    frames.forEach((frame, i) => {
        // Retrieve files with their content (Array buffer)
        files.push({ name: `source${i}.png`, content: frame.content.slice(0) }); // 'slice(0)' because Magick will empty the ArrayBuffer

        // Add delays for each frame in the command
        commandDelays.push('-delay', `${frame.delay}x1000`, `source${i}.png`);
    });

    // Define the command for Image Magick
    const command = ['convert', ...commandDelays, '-loop', '0', 'out.gif'];

    return await Magick.Call(files, command);
};



/**
 * @param {ArrayBuffer} imageArrayBuffer GIF's image array buffer
 * @returns {Array<number>} GIF's delay for each frame
 */
const getDelays = imageArrayBuffer => {
    let delays = [];
    getInfo(imageArrayBuffer).images.forEach(image => delays.push(image.delay));
    return delays;
}



/**
 * @param {string} dataURL Base 64 image data URL
 * @returns {Promise<ArrayBuffer>} Array buffer
 * @note https://stackoverflow.com/questions/53817109/image-to-arraybuffer-in-js
 */
const base64ToArrayBuffer = async dataURL => {
    return (fetch(dataURL)
        .then(function (result) {
            return result.arrayBuffer();
        }));
}



/**
 * @param {Blob} blob The blob
 * @returns {Promise<string>} Image data URL
 * @note https://stackoverflow.com/questions/23150333/html5-javascript-dataurl-to-blob-blob-to-dataurl
 */
function blobToDataURL(blob) {
    return new Promise(resolve => {
        const fileReader = new FileReader();
        fileReader.onload = e => resolve(e.target.result);
        fileReader.readAsDataURL(blob);
    });
}



/* ------------------------------------------------------------------------- */
/*                                  Exports                                  */
/* ------------------------------------------------------------------------- */

// Attach the functions to the 'window' object to be able to use them
// in a non-module javascript file. 
window.extractFrames = extractFrames;
window.createGIF = createGIF;
window.getDelays = getDelays;
window.base64ToArrayBuffer = base64ToArrayBuffer;
window.blobToDataURL = blobToDataURL;
