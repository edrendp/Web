// All functionality has been removed as the service is discontinued

// Add advanced interactions to the unavailable icon
document.addEventListener('DOMContentLoaded', function() {
    const icon = document.querySelector('.unavailable-icon');
    const img = document.querySelector('.unavailable-img');
    
    if (icon && img) {
        // Add 3D rotation effect on mouse move
        document.addEventListener('mousemove', function(e) {
            if (window.innerWidth <= 768) return; // Disable on mobile
            
            const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
            
            icon.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });
        
        // Reset on mouse leave
        document.addEventListener('mouseleave', function() {
            icon.style.transform = 'rotateY(0deg) rotateX(0deg)';
        });
        
        // Add click effect
        icon.addEventListener('click', function() {
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Add a ripple effect with neutral color
            const ripple = document.createElement('div');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
        
        // Add advanced animation class after initial animation completes
        setTimeout(() => {
            icon.classList.add('advanced-animation');
        }, 2000);
        
        // Random subtle effect every 5-10 seconds (without red color)
        setInterval(() => {
            img.style.filter = 'contrast(1.2) brightness(1.1)';
            img.style.transform = 'scale(1.05) skew(1deg, 1deg)';
            
            setTimeout(() => {
                img.style.filter = '';
                img.style.transform = '';
            }, 150);
        }, Math.random() * 5000 + 5000);
    }
});
