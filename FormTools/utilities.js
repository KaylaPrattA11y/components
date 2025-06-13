import getUSD from "../../strings/getUSD";
import getFormattedUnit from "../../strings/getFormattedUnit";

/**
 * Checks the validity state of a form field and returns a comma-separated string
 * listing all the validity properties that are currently true (indicating errors),
 * excluding the "valid" property itself.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field - The input, select, or textarea field element to check.
 * @returns {string} A comma-separated string of the validity states that are true (e.g., "valueMissing,typeMismatch"), or an empty string if the field is valid or only the "valid" property is true.
 */
export function validityStateToString(field) {
  const array = [];
  // It needs to be done this way to map ValidityState values
  // eslint-disable-next-line no-restricted-syntax
  for (const key in field.validity) {
    if (field.validity[key] && key !== "valid") {
      array.push(key);
    }
  }
  return array.join(", ");
}

/**
 * @desc Attempts to find an appropriate label for the field using ARIA values
 * @param {HTMLInputElement|RadioNodeList|HTMLTextAreaElement|HTMLSelectElement} field
 * @returns {string}
 */
function getAriaLabel(field) {
  const ariaLabelledby = field.getAttribute("aria-labelledby");
  const labelledbyIds = ariaLabelledby?.split(" ");
  const labelledbyElements = labelledbyIds?.map(id => document.getElementById(id));
  const ariaLabel = field.getAttribute("aria-label");

  if (ariaLabelledby && labelledbyElements) {
    return labelledbyElements.map(element => element.textContent).join(", ");
  }
  if (ariaLabel) {
    return field.getAttribute("aria-label");
  }
  return null;
}

/**
 * @desc Formats a number based on the provided format string. If no format is provided, it defaults to the US number format.
 * @param {number} number
 * @param {string} format
 * @returns {string}
 */
export function numberFormatter(number, format) {
  if (format === "currency") {
    return getUSD(number, 0);
  }
  if (format === "number") {
    return new Intl.NumberFormat("en-US").format(number);
  }
  return getFormattedUnit(number, format, "short");
}

/**
 * @desc Gets the field's appropriate label most relevant to the user reading the data. Falls back to the field's name or id if no label is found
 * @param {HTMLInputElement|RadioNodeList|HTMLTextAreaElement|HTMLSelectElement} field
 * @returns {string}
 */
export function getFieldLabel(field) {
  const fallbackLabel = field.name || field.id || "";
  const isRadio = field instanceof RadioNodeList;

  const fieldElement = isRadio ? field[0] : field;
  const legendElement = fieldElement.closest("fieldset")?.querySelector(":scope > legend");
  const labelsHaveTextContent = [...fieldElement?.labels]?.some(label => label.textContent);

  if (isRadio && legendElement) {
    return legendElement.textContent.trim();
  }
  if (fieldElement.labels && fieldElement.labels.length > 0 && labelsHaveTextContent) {
    return [...fieldElement.labels]
      .map(label => label.textContent)
      .join(", ")
      .trim();
  }
  return getAriaLabel(fieldElement) || fallbackLabel;
}

/**
 * @desc Gets the field's appropriate value (not the actual value per the `[value]` attribute) most relevant to the user reading the data. Falls back to the field's value attribute.
 * @param {HTMLInputElement|RadioNodeList|HTMLTextAreaElement|HTMLSelectElement} field
 * @returns {string}
 */
export function getFieldValue(field) {
  const fallbackValue = field.value || "";
  const isRadio = field instanceof RadioNodeList;
  const isSelect = field instanceof HTMLSelectElement;

  if (isRadio) {
    const checkedRadios = [...field].filter(radio => radio.checked);
    return [...checkedRadios].map(radio => {
      const labels = [...radio.labels];
      return labels.map(label => label.textContent).join(", ");
    });
  }
  if (isSelect) {
    const selectedOptions = [...field.options].filter(option => option.selected);
    return selectedOptions.map(option => option.label).join(", ");
  }
  return fallbackValue;
}

/**
 * Converts FormData into an array of objects, each containing a field's name and value.
 * Handles fields with the same name by creating separate entries for each.
 * @param {HTMLFormElement} formElement - The form element.
 * @returns {FormFieldData[]} An array of objects representing the form data entries.
 */
export function getFormDataArray(formElement) {
  const formData = new FormData(formElement);
  const data = [];
  formData.forEach((value, name) => {
    data.push({ name, value });
  });
  return data;
}
