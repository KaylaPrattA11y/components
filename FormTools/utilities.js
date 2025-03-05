import getUSD from "../../strings/getUSD";
import getFormattedUnit from "../../strings/getFormattedUnit";

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
  
  field = isRadio ? field[0] : field;
  const legendElement = field.closest("fieldset")?.querySelector(":scope > legend");

  if (field.name === "startTime") {
    console.log("startTime", field);
  }
  if (isRadio && legendElement) {
    return legendElement.textContent;
  }
  if (field.labels && field.labels.length > 0) {
    return [...field.labels].map(label => label.textContent).join(", ");
  }
  return getAriaLabel(field) || fallbackLabel;
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
