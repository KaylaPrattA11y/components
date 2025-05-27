import { i18nReplace } from "../../translations";
import FormHelper from "./FormHelper";
import { getFieldLabel, getFieldValue, numberFormatter } from "./utilities";
import { dataShow, dataHide } from "../../../v1.5/binding-utils";
import highlightElement from "../../dom/highlightElement";

/**
 * @typedef {import("../../../types/FormTableEntryMutator").FormTableEntryMutator} FormTableEntryMutator
 */

/**
 * @desc Creates a button to jump to edit the field in the form
 * @param {HTMLTableCellElement} valueCell
 * @param {HTMLInputElement|RadioNodeList|HTMLTextAreaElement|HTMLSelectElement} fieldElement
 * @param {String} fieldName The human-readable name of the field
 * @param {Function} [anchorMutator] A function that mutates the anchor element. Optional
 */
function buildEditFieldButton(valueCell, fieldElement, fieldName, anchorMutator) {
  const editFieldButton = document.createElement("button");
  const isSelect = fieldElement instanceof HTMLSelectElement;
  const isRadio = fieldElement instanceof RadioNodeList;
  let href = fieldElement.id;

  editFieldButton.className = "icon-md icon-edit-solid btn-default system-color mis-xs";
  editFieldButton.type = "button";
  editFieldButton.dataset.hide = "isReceiptMode";
  editFieldButton.setAttribute("aria-label", i18nReplace("editN", fieldName));
  if (anchorMutator) {
    href = anchorMutator(fieldElement, fieldName);
    if (href.startsWith("#")) {
      href = href.substring(1);
    }
  } else if (isRadio) {
    const checked = [...fieldElement].find(radio => radio.checked);
    href = checked ? checked.id : fieldElement[0].id;
  } else if (isSelect && document.getElementById(`${fieldElement.id}-button`)) {
    href = `${fieldElement.id}-button`;
  }
  editFieldButton.addEventListener("click", event => {
    const target = document.getElementById(href);
    event.preventDefault();
    window.location.hash = `#${href}`;
    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    highlightElement(target, 3, true);
  });
  valueCell.appendChild(editFieldButton);
}

/**
 * @desc A class that provides methods for managing the form data table element, which displays the form field names, values, and validity states.
 * @class FormTable
 */
export default class FormTable {
  /**
   * @desc Updates the existing table's body with the latest form data
   * @param {HTMLFormElement} formElement
   * @param {HTMLTableElement} tableElement
   * @param {Object.<FormTableEntryMutator>} mutators An object of custom mutators to apply to individual field values/labels to change how they are displayed in the table. Default empty object
   */
  static updateTableBody(formElement, tableElement, mutators) {
    const formData = FormHelper.getFormDataArray(formElement);
    const hasEditButtons = tableElement.dataset.hasEditButtons === "true";
    let tbody = tableElement.querySelector("tbody");

    if (tbody) {
      tbody.remove();
    }
    tbody = tableElement.createTBody();
    formData.forEach(field => {
      const fieldElement = formElement.elements[field.name];
      const rowAlreadyExists = tbody.querySelector(`tr[data-field-name="${field.name}"]`);
      const isDisabledOrHidden = fieldElement?.disabled || fieldElement?.type === "hidden";
      const isNotRequiredAndIsEmpty = fieldElement?.required === false && fieldElement?.value === "";
      const doExclude = fieldElement.dataset?.formTableExclude;
      const doSwapNameAndValue = fieldElement.dataset?.formTableSwapNameAndValue;
      const valueMutator = mutators[field.name]?.valueMutator;
      const labelMutator = mutators[field.name]?.labelMutator;
      if (rowAlreadyExists || isDisabledOrHidden || doExclude === "true" || isNotRequiredAndIsEmpty) return;

      const row = tbody.insertRow();
      const nameCell = row.insertCell(0);
      const valueCell = row.insertCell(1);
      const fieldIsInvalid = fieldElement?.validity?.valid === false;
      const doFormatNumber = fieldElement.dataset?.numberFormatter;
      let fieldName = getFieldLabel(fieldElement);
      let fieldValue = getFieldValue(fieldElement);

      if (doFormatNumber) {
        fieldValue = numberFormatter(fieldValue, doFormatNumber);
      }

      if (doSwapNameAndValue) {
        fieldName = getFieldValue(fieldElement);
        fieldValue = getFieldLabel(fieldElement);
      }

      row.dataset.fieldName = field.name;
      row.classList.toggle("error-color", fieldIsInvalid);

      nameCell.className = "ts-body-2";
      valueCell.className = "ts-body-1";

      if (labelMutator) {
        const mutatedLabel = labelMutator(fieldElement, fieldName);
        nameCell.innerHTML = mutatedLabel;
      } else {
        nameCell.textContent = fieldName;
      }

      if (valueMutator) {
        const mutatedValue = valueMutator(fieldElement, fieldValue);
        valueCell.innerHTML = mutatedValue;
      } else {
        valueCell.textContent = fieldValue;
      }

      if (hasEditButtons) {
        buildEditFieldButton(valueCell, fieldElement, fieldName, mutators[field.name]?.anchorMutator);
      }
    });
  }

  /**
   * @desc Creates a table element with the form data
   * @param {HTMLFormElement} formElement
   * @param {String} [tableSettings.id] Add an id to the table. Optional
   * @param {String} [tableSettings.className] Add a class name to the table. Optional
   * @param {String|null} [tableSettings.caption] Add a string to the table caption. Optional
   * @param {Boolean} [tableSettings.thead=false] Add a table header to the table. Default false
   * @param {Boolean} [tableSettings.hasEditButtons=false] Add an edit button to the table next to the current value. Default false
   * @param {Object.<FormTableEntryMutator>} [tableSettings.mutators={}] An object of custom mutators to apply to individual field values/labels to change how they are displayed in the table. Default empty object
   * @returns {HTMLTableElement} A table element with the form data.
   */
  static generateTable(formElement, { id, className, caption, thead = false, hasEditButtons = false, mutators = {} }) {
    let tableElement = document.getElementById(id);
    if (tableElement && tableElement instanceof HTMLTableElement) {
      FormTable.updateTableBody(formElement, tableElement, mutators);
      return tableElement;
    }

    tableElement = document.createElement("table");
    if (id) {
      tableElement.id = id;
    }
    if (className) {
      tableElement.className = className;
    }
    if (caption) {
      const captionElement = tableElement.createCaption();
      captionElement.textContent = caption;
      captionElement.className = "ts-h3-aa mbe-xs";
    }
    if (thead) {
      const theadElement = tableElement.createTHead();
      const headerRow = theadElement.insertRow();
      const nameHeader = headerRow.insertCell(0);
      const valueHeader = headerRow.insertCell(1);

      theadElement.className = "ts-subtitle-2";
      nameHeader.textContent = "Field Name";
      valueHeader.textContent = "Value";
    }
    tableElement.dataset.hasEditButtons = hasEditButtons;
    FormTable.updateTableBody(formElement, tableElement, mutators);
    return tableElement;
  }

  /**
   * @desc Creates a table footer with an optional print button and hides any "Edit" buttons
   * @param {HTMLTableElement} tableElement
   * @param {Boolean} [doEnable=true]
   */
  static enableReceiptMode(tableElement, doEnable = true) {
    tableElement.classList.toggle("is-receipt-mode", doEnable);
    dataShow(tableElement, { isReceiptMode: doEnable });
    dataHide(tableElement, { isReceiptMode: doEnable });
  }
}
