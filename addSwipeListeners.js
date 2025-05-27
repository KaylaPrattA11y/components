/**
 * @param {HTMLElement} element - The element to attach the swipe listeners to
 * @param {Function} [onSwipeUp] - Callback function for swipe up event
 * @param {Function} [onSwipeRight] - Callback function for swipe right event
 * @param {Function} [onSwipeLeft] - Callback function for swipe left event
 * @param {Function} [onSwipeDown] - Callback function for swipe down event 
 * @param {Number} [minSwipeDistance=50] - Minimum distance to consider a swipe
 */
export default function addSwipeListeners({element, onSwipeUp, onSwipeRight, onSwipeLeft, onSwipeDown, minSwipeDistance = 50}) {
  let startX = 0;
  let endX = 0;
  let startY = 0;
  let endY = 0;

  /**
   * @desc Determines the direction of the swipe
   * @returns {"UP|"RIGHT"|"DOWN"|"LEFT"|null} The direction of the swipe
   */
  function getDirection() {
    const totalHorizontalDistance = Math.abs(endX - startX);
    const totalVerticalDistance = Math.abs(endY - startY);
    
    if (totalHorizontalDistance < minSwipeDistance && totalVerticalDistance < minSwipeDistance) {
      return null; // No swipe detected
    }
    if (totalVerticalDistance > totalHorizontalDistance) {
      if (startY > endY) {
        return "UP";
      }
      if (startY < endY) {
        return "DOWN";
      }
    } else {
      if (startX > endX) {
        return "LEFT";
      }
      if (startX < endX) {
        return "RIGHT";
      }
    }
    return null; // No direction detected
  }

  element.addEventListener("touchstart", event => {
    startX = event.changedTouches[0].screenX;
    startY = event.changedTouches[0].screenY;
  });

  element.addEventListener("touchend", event => {
    endX = event.changedTouches[0].screenX;
    endY = event.changedTouches[0].screenY;

    switch(getDirection()) {
      case "UP":
        if (onSwipeUp) onSwipeUp(event);
        break;
      case "RIGHT":
        if (onSwipeRight) onSwipeRight(event);
        break;
      case "DOWN":
        if (onSwipeDown) onSwipeDown(event);
        break;
      case "LEFT":
        if (onSwipeLeft) onSwipeLeft(event);
        break;
      default:
        break;
    }
  });
}