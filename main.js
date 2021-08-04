/* ------------------------------------------------------------------------- */
/*                                  Imports                                  */
/* ------------------------------------------------------------------------- */

// UtilGIF.js
const extractFrames = window.extractFrames;
const createGIF = window.createGIF;
const getDelays = window.getDelays;
const base64ToArrayBuffer = window.base64ToArrayBuffer;
const blobToDataURL = window.blobToDataURL;

// Bubble.js
const Bubble = window.Bubble;



/* ------------------------------------------------------------------------- */
/*                             Global Variables                              */
/* ------------------------------------------------------------------------- */

let frames = [];
let selectedFramePosition = 0;



/* ------------------------------------------------------------------------- */
/*                                  Events                                   */
/* ------------------------------------------------------------------------- */

/**
 * When a file is imported. 
 */
document.querySelector('#import-gif').addEventListener('change', function () {
    // Cancelled file upload
    if (this.files.length === 0)
        return;

    // Error: Wrong file type (not a GIF)
    if (this.files[0].type !== 'image/gif') {
        alert('Wrong file type !\nExpected a GIF. ');
        return;
    }

    // If the <img> HTML element isn't present (= only the first import)
    if (!document.querySelector('#gif-preview img')) {
        // Create the <img> HTML element
        const imgElement = document.createElement('img');
        imgElement.alt = "Imported GIF";
        imgElement.style.display = 'none'; // Hidden by default, shown when the GIF is loaded
        document.getElementById('gif-preview').appendChild(imgElement);
    }

    const previewImage = document.querySelector('#gif-preview img');
    const file = this.files[0];
    const fileReader = new FileReader();

    fileReader.readAsDataURL(file);
    fileReader.onloadend = async function () {
        resetFrames();

        // Display imported GIF in the preview image
        previewImage.src = this.result;

        // Hide the placeholder and show the image when it's loaded (only the first time)
        if (previewImage.style.display === 'none') {
            previewImage.addEventListener('load', function () {
                document.getElementById('gif-preview-placeholder').style.display = 'none';
                this.style.display = 'block';
            });
        }

        // Extract frames from GIF
        const arrayBuffer = await base64ToArrayBuffer(this.result);
        const processedFiles = await extractFrames(arrayBuffer);
        const delays = getDelays(arrayBuffer); // Delays for each frame

        const framesElement = document.querySelector('#frames');

        // Hide the placeholder and show the '#frames' element (only the first time)
        if (getComputedStyle(framesElement).display === 'none') {
            document.querySelector('#frames-placeholder').style.display = 'none';
            framesElement.style.display = 'grid';
        }

        // Show the title of the frames section
        document.querySelector('#frames-section h2').style.display = 'block';

        // Display frames  & store their buffers and delays
        let nextBubbleDelay = 0;
        for (let i = 0; i < processedFiles.length; i++) {
            const file = processedFiles[i];
            const dataURL = await blobToDataURL(file.blob);

            // If the device used isn't a mobile device + Limits the number of bubbles
            if (!isMobile() && i % Math.floor(processedFiles.length / 30) === 0) {
                // Create a bubble with the frame
                setTimeout(() => {
                    requestAnimationFrame(async () => new Bubble(document.querySelector('body'), dataURL));
                }, nextBubbleDelay);

                nextBubbleDelay += 500;
            }

            // Add delay for an animation where frames are displayed one after another
            await sleep(10);

            // Display GIF frame as HTML element
            let frame = document.createElement('img');
            frame.id = `frame-${i}`
            frame.className = 'frame';
            frame.src = dataURL;
            frame.onclick = function () { selectFrame.call(this) };
            framesElement.appendChild(frame);

            // Push image buffer & delay into 'frames' (Used to create a new GIF)
            frames.push({ content: file.buffer, delay: delays[i] });
        }
    }
});



/**
 * When the user clicks on the "Download updated" button. 
 */
document.querySelector('#download-updated').addEventListener('click', async () => {
    if (frames.length === 0)
        return;

    await sleep(200);

    // Show the downloading screen
    document.querySelector('#downloading-screen').style.display = 'flex';

    // Create the new GIF
    const newGIF = await createGIF(rotateArray(frames, selectedFramePosition));

    // Download it
    downloadBase64File('image/gif', removeContentType(await blobToDataURL(newGIF[0].blob), 'output'));

    // Hide the downloading screen
    document.querySelector('#downloading-screen').style.display = 'none';
});



/* ------------------------------------------------------------------------- */
/*                                Functions                                  */
/* ------------------------------------------------------------------------- */

/**
 * Returns a n-times rotated array based on the array passed
 * in parameter (which remains unchanged). 
 * Example of a rotation : [1, 2, 3] => [2, 3, 1]
 * @param {Array} array The array
 * @param {number} n Number of rotations
 * @returns {Array} The rotated new array
 */
function rotateArray(array, n) {
    let newArray = Array.from(array);
    for (let i = 0; i < n; i++)
        newArray.push(newArray.shift())
    return newArray;
}



/**
 * Removes the content type from a base 64 data string. 
 * @param {string} base64WithContentType Base 64 data with a content type at the start of the string
 * @returns Raw base 64 data (without a content type). 
 */
function removeContentType(base64WithContentType) {
    return base64WithContentType.slice(base64WithContentType.indexOf(';base64,') + ';base64,'.length);
}



/**
 * Resets 'selectedFramePosition' and 'frames' array, empties and hides '#frames' HTML elements,
 * hides the title of the frames section, shows the placeholder,
 * hides "No frames to display." text and shows loader icon. 
 */
function resetFrames() {
    selectedFramePosition = 0;

    // Empty frames array
    frames = [];

    // Empty and hide '#frames' HTML element
    document.querySelector('#frames').innerHTML = '';
    document.querySelector('#frames').style.display = 'none';

    // Hide the title of the frames section
    document.querySelector('#frames-section h2').style.display = 'none';

    // Show the placeholder
    document.querySelector('#frames-placeholder').style.display = 'flex';

    // Hide "No frames to display." text
    document.querySelector('#frames-placeholder p').style.display = 'none';

    // Show loader icon
    document.querySelector('#frames-placeholder .loader').style.display = 'block';
}



/**
 * Changes value of 'selectedFramePosition' and adds '.frame-selected' frames
 * to the clicked frame.
 * @note Must be called with 'this' contect : selectFrame.call(this)
 */
function selectFrame() {
    // Select the clicked frame
    selectedFramePosition = parseInt(this.id.slice('frame-'.length));

    // Add 'frame-selected' class
    document.querySelectorAll('.frame-selected').forEach(e => e.classList.remove('frame-selected'));
    this.classList.add('frame-selected');
}



/**
 * Make the user download a base 64 file. 
 * @param {string} contentType The MIME content type
 * @param {string} base64Data Raw base 64 data
 * @param {string} fileName File's name
 */
function downloadBase64File(contentType, base64Data, fileName) {
    const linkSource = `data:${contentType};base64,${base64Data}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
    downloadLink.remove();
}



/**
 * Checks if the device used is a mobile device. 
 * @returns {boolean} True if the device used is a mobile device, else false
 * @note http://detectmobilebrowsers.com/
 */
function isMobile() {
    return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(navigator.userAgent || navigator.vendor || window.opera) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test((navigator.userAgent || navigator.vendor || window.opera).substr(0, 4));
}



/**
 * Stops the execution of the script for a provided time. 
 * @param {number} ms Number of milliseconds
 * @returns {Promise} Promise resolving after the required time
 */
function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}
