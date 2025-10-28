import { useSwipeable } from 'react-swipeable';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface SwipeableViewsProps {
  children: React.ReactNode;
}

export function SwipeableViews({ children }: SwipeableViewsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const routes = ['/', '/you', '/coach'];
  const currentIndex = routes.indexOf(location.pathname);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isMobile) return;
      // Swipe left = next page
      if (currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      if (!isMobile) return;
      // Swipe right = previous page
      if (currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 50,
  });

  return <div {...handlers}>{children}</div>;
}
