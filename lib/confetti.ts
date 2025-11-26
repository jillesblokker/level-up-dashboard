export function triggerConfetti(x: number, y: number) {
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('confetti-particle');

        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 4;
        const size = 5 + Math.random() * 5;

        // Set styles
        particle.style.backgroundColor = color || '#fbbf24';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // Animation physics
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        document.body.appendChild(particle);

        // Animate
        let opacity = 1;
        let posX = x;
        let posY = y;
        let time = 0;

        const animate = () => {
            time += 0.1;
            posX += vx;
            posY += vy + (time * 0.5); // Gravity
            opacity -= 0.02;

            particle.style.transform = `translate(${posX - x}px, ${posY - y}px) rotate(${time * 20}deg)`;
            particle.style.opacity = opacity.toString();

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };

        requestAnimationFrame(animate);
    }
}
