
let index = null;
let prevIndex = null;

let nodes = [];

export function clearNodes() {
    index = null;
    prevIndex = null;
    nodes = [];
}

export function appendNode(node) {
    nodes.push(node);
}

export function next() {
    if (nodes.length === 0) return;
    prevIndex = index;

    if (index === null) index = 0;
    else index = (index + 1) % nodes.length;

    onIndexChange();
}

export function previous() {
    if (nodes.length === 0) return;
    prevIndex = index;

    if (index === null) index = nodes.length - 1;
    else {
        if (index === 0) index = nodes.length - 1;
        else index--;
    }

    onIndexChange();
}


// ? fromNext determines whether the call is coming from next function or not for removing prev hightlight
function onIndexChange() {
    
    if (prevIndex !== null && nodes[prevIndex]) {
        nodes[prevIndex].style.backgroundColor = 'lightblue';
    }

    const currentNode = nodes[index];
    if (currentNode) {
        currentNode.style.backgroundColor = 'orange';

        currentNode.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
    }
}