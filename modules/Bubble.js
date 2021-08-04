class Bubble {
    /**
     * Creates a bubble. 
     * @param {Element} root HTML Element in which the bubble will be created
     * @param {string} src Image's src attribute
     */
    constructor(root, src) {
        this.root = root;
        this.src = src;

        this.bubbleImg = undefined;
        this.handleNewBubble();

        // Starting position
        this.posY = innerHeight; // Bubbles start at the bottom
        this.posX = this.randomNumber(innerWidth - 20, 20);

        this.bubbleImg.style.top = `${this.posY}px`;
        this.bubbleImg.style.left = `${this.posX}px`;

        // Setting height and width of the bubble
        this.height = this.randomNumber(100, 20);
        this.width = this.height;

        // Remove the bubble after a random amount of time
        this.bubbleEnd.call(this.bubbleImg, this.randomNumber(10000, 7500));
    }

    // Creates and appends a new bubble in the DOM
    handleNewBubble() {
        this.bubbleImg = document.createElement('img');
        this.bubbleImg.classList.add('bubble');
        this.bubbleImg.src = this.src;
        this.root.append(this.bubbleImg);
        this.handlePosition();
    }

    handlePosition() {
        this.bubbleImg.style.height = `${this.height}px`;
        this.bubbleImg.style.width = `${this.height}px`;

        this.posY -= this.randomNumber(300, 10);
        this.posX -= this.randomNumber(300, -300);

        this.bubbleImg.style.top = `${this.posY}px`;
        this.bubbleImg.style.left = `${this.posX}px`;

        const randomSec = this.randomNumber(2000, 200);
        setTimeout(this.handlePosition.bind(this), randomSec); // Calling for re-position of bubble
    }

    randomNumber(max, min) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    bubbleEnd(removingTime = 0) {
        setTimeout(
            () => {
                requestAnimationFrame(() => this.classList.add('bubble-burst'));
            },
            removingTime === 0 ? removingTime : removingTime - 100
        );

        setTimeout(() => {
            requestAnimationFrame(() => this.remove());
        }, removingTime);
    }
}



/* ------------------------------------------------------------------------- */
/*                                  Exports                                  */
/* ------------------------------------------------------------------------- */

// Attach the class to the 'window' object to be able to use it
// in a non-module javascript file. 
window.Bubble = Bubble;
