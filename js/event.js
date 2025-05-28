socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
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
    else if (msg.type === 'delete') {
        const target = [...document.querySelectorAll('.draggable')].find(el => el.dataset.cardId === msg.id);
        target.remove();
        target = null;
    }
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
});