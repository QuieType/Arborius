//event.js
//listening for different inputs

//Todo: divide this code into websocket.js, input.js, and resolve.js

//constants
const socket = new WebSocket('wss://arborius.online');

//connect to websocket
socket.addEventListener('open', () => {
    console.log('WebSocket connection established');
});

socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    //snap cards to grid when moving
    if (msg.type === 'move') {
        const target = [...document.querySelectorAll('.draggable')].find(el => el.dataset.cardId === msg.id);
        if (target) {
            target.style.left = msg.x + 'px';
            target.style.top = msg.y + 'px';
            target.setAttribute('data-rotation', msg.rotation);
            target.style.transform = `translate(${-10 * msg.z}px, ${-10 * msg.z}px)`;
            target.style.zIndex = ++currentZ;
            const info = target.querySelector('.info');
            info.style.transform = `rotate(${msg.rotation}deg)`;
        }
    }
    //delete cards
    else if (msg.type === 'delete') {
        const target = [...document.querySelectorAll('.draggable')].find(el => el.dataset.cardId === msg.id);
        target.remove();
        target = null;
    }
    //duplicate cards
    else if (msg.type === 'duplicate') {
        const target = [...document.querySelectorAll('.draggable')].find(el => el.dataset.cardId === msg.srcid);
        const clone = target.cloneNode(true);
        const offset = 20;
        clone.dataset.cardId = msg.id;
        clone.style.left = (parseInt(target.style.left, 10) + offset) + 'px';
        clone.style.top = (parseInt(target.style.top, 10) + offset) + 'px';
        clone.style.zIndex = ++currentZ;
        document.body.appendChild(clone);
        
        // Ensure cloned element has same events
        // Can we simplify this?
        clone.addEventListener('mousedown', (e) => {
            dragged = clone;
            offsetX = e.clientX - clone.offsetLeft;
            offsetY = e.clientY - clone.offsetTop;
            clone.style.zIndex = ++currentZ;
            clone.style.cursor = 'grabbing';
            clone.classList.add('dragging');
        });
        clone.addEventListener('mouseenter', () => target = clone);
        clone.addEventListener('mouseleave', () => target = null);
    }
    else if (msg.type === 'create') {
        addCard(msg.name, msg.color, false); // Don't rebroadcast again
    }

});

document.addEventListener('keydown', (e) => {
    //do something with this probably
    if (!hovered) {return;}
    //rotation: q or e
    if ((e.key === 'q' || e.key === 'e')) {
        let currentRotation = parseInt(hovered.getAttribute('data-rotation') || '0', 10);
        if (e.key === 'q') currentRotation -= 90;
        if (e.key === 'e') currentRotation += 90;
        hovered.setAttribute('data-rotation', currentRotation);
        
        const cardFrame = hovered.querySelector('.cardframe');
        const angle = currentRotation % 360;
        
        // Adjust box shadow based on rotation angle
        let shadowX = 4, shadowY = 4, shadowX2 = 7, shadowY2 = 7;
        
        const borderColor = getComputedStyle(cardFrame).borderColor;
        cardFrame.style.boxShadow = `${shadowX}px ${shadowY}px 0 ${borderColor}, ${shadowX2}px ${shadowY2}px 0 ${borderColor}`;

        // Apply rotation only to inner content
        const info = cardFrame.querySelector('.info');
        info.style.transform = `rotate(${currentRotation}deg)`;
        sendCardMove(hovered);
    }
    
    //clone cards: d
    if (e.key === 'd') {
        const clone = hovered.cloneNode(true);
        const offset = 20;
        clone.dataset.cardId = cardcount++;
        clone.style.left = (parseInt(hovered.style.left, 10) + offset) + 'px';
        clone.style.top = (parseInt(hovered.style.top, 10) + offset) + 'px';
        clone.style.zIndex = 100;
        document.body.appendChild(clone);
        
        // Ensure cloned element has same events
        //ugh
        clone.addEventListener('mousedown', (e) => {
            dragged = clone;
            offsetX = e.clientX - clone.offsetLeft;
            offsetY = e.clientY - clone.offsetTop;
            clone.style.zIndex = 100;
            clone.style.cursor = 'grabbing';
            clone.classList.add('dragging');
        });
        clone.addEventListener('mouseenter', () => hovered = clone);
        clone.addEventListener('mouseleave', () => hovered = null);
        socket.send(JSON.stringify({
            type: 'duplicate',
            id: clone.dataset.cardId,
            srcid: hovered.dataset.cardId,
            x: parseInt(offsetX),
            y: parseInt(offsetY),
            z: clone.dataset.overlapCount,
            rotation: parseInt(clone.getAttribute('data-rotation') || '0', 10)
        }));
    }
    //delete cards: backspace
    if (e.key === 'Backspace') {
        socket.send(JSON.stringify({
            type: 'delete',
            id: hovered.dataset.cardId
        }));
        hovered.remove();
        hovered = null;
    }
});

//release cards
document.addEventListener('mouseup', () => {
    if (!dragged) {return;}
    let left = parseInt(dragged.style.left, 10);
    let top = parseInt(dragged.style.top, 10);
    dragged.style.left = Math.round(left / gridSize) * gridSize + 'px';
    dragged.style.top = Math.round(top / gridSize) * gridSize + 'px';
    dragged.style.cursor = 'grab';
    dragged.classList.remove('dragging');
    
    // Check for overlap and count
    const draggedRect = dragged.getBoundingClientRect();
    let overlapCount = 0;
    document.querySelectorAll('.draggable').forEach(el => {
        if (el !== dragged) {
            const rect = el.getBoundingClientRect();
            const overlap = !(
                draggedRect.right < rect.left+50 ||
                draggedRect.left > rect.right-50 ||
                draggedRect.bottom < rect.top+50 ||
                draggedRect.top > rect.bottom-50
            );
            if (overlap) {
                overlapCount++;
                //console.log(overlapCount); //do we need this?
            }
        }
    });
    dragged.dataset.overlapCount = overlapCount;
    sendCardMove(dragged);
    
    // Apply transform based on overlap count
    dragged.style.transform = `translate(${-10 * overlapCount}px, ${-10 * overlapCount}px)`;
    dragged = null;
});
