import Modal from "./component";

/**
 * @desc Adds custom event listeners for the Modal component. You can also dispatch custom events to show, close, or lock a modal.
 * @example document.dispatchEvent(new CustomEvent("Modal:show", { detail: { id: "dialogId" } }));
 * @example document.dispatchEvent(new CustomEvent("Modal:close", { detail: { id: "dialogId" } }));
 * @example document.dispatchEvent(new CustomEvent("Modal:lock", { detail: { id: "dialogId" } }));
 * @example document.dispatchEvent(new CustomEvent("Modal:unlock", { detail: { id: "dialogId" } }));
 */
export default function modalEventListeners() {
  document.addEventListener("click", event => {
    const ariaControls = event.target.getAttribute("aria-controls");
    const targetEl = document.getElementById(ariaControls);
    const isDialog = targetEl instanceof HTMLDialogElement;
    const newModalOnly = targetEl?.classList.contains("neo-dialog"); // Only allow this to happen on new modals, not legacy ones. @TODO: remove this once all "Dialog" components are replaced.

    if (ariaControls && targetEl && isDialog && newModalOnly) {
      Modal.toggle(ariaControls);
    }
  });
  document.addEventListener("Modal:show", event => {
    if (event.detail.id) {
      Modal.show(event.detail.id);
    }
  });
  document.addEventListener("Modal:close", event => {
    if (event.detail.id) {
      Modal.close(event.detail.id);
    }
  });
  document.addEventListener("Modal:lock", event => {
    if (event.detail.id) {
      Modal.lock(event.detail.id, true);
    }
  });
  document.addEventListener("Modal:unlock", event => {
    if (event.detail.id) {
      Modal.lock(event.detail.id, false);
    }
  });
}