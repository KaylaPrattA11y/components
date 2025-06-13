import Modal from "./component";

/**
 * @desc Adds custom event listeners for the Modal component. You can also dispatch custom events to show, close, or lock a modal.
 * @example document.dispatchEvent(new CustomEvent("Modal:show", { detail: { id: "dialogId", closeOthers: true } }));
 * @example document.dispatchEvent(new CustomEvent("Modal:close", { detail: { id: "dialogId", forceClose: false } }));
 * @example document.dispatchEvent(new CustomEvent("Modal:lock", { detail: { id: "dialogId", doLock: true } }));
 */
export default function modalEventListeners() {
  document.addEventListener("click", event => {
    const ariaControls = event.target.getAttribute("aria-controls");
    const targetEl = document.getElementById(ariaControls);
    const isDialog = targetEl instanceof HTMLDialogElement;
    const isTabbed = targetEl?.classList.contains("is-tabbed"); // These have their own handlers
    const newModalOnly = targetEl?.classList.contains("neo-dialog"); // Only allow this to happen on new modals, not legacy ones. @TODO: remove this once all "Dialog" components are replaced.

    if (ariaControls && targetEl && isDialog && !isTabbed && newModalOnly) {
      Modal.toggle(ariaControls, true, event.target);
    }
  });
  document.addEventListener("Modal:show", event => {
    if (event.detail) {
      Modal.show(event.detail.id, event.detail.closeOthers || true);
    }
  });
  document.addEventListener("Modal:close", event => {
    if (event.detail) {
      Modal.close(event.detail.id, event.detail.forceClose || false);
    }
  });
  document.addEventListener("Modal:lock", event => {
    if (event.detail) {
      Modal.lock(event.detail.id, event.detail.doLock || true);
    }
  });
}
