export function attachButtonClickListener(
  target: {
    addEventListener(type: string, listener: EventListener): void;
  },
  listener: EventListener,
) {
  target.addEventListener("click", listener);
}
