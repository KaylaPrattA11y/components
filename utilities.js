/**
 * @desc Attempts to find an appropriate label for the field using ARIA values. Falls back to the field's name or id if no label is found.
 * @param {HTMLInputElement|RadioNodeList|HTMLTextAreaElement|HTMLSelectElement} field 
 * @returns {string}
 */
function getAriaLabel(field) {
  const ariaLabelledby = field.getAttribute("aria-labelledby");
  const labelledbyIds = ariaLabelledby?.split(" ");
  const labelledbyElements = labelledbyIds?.map(id => document.getElementById(id));
  const ariaLabel = field.getAttribute("aria-label");
  
  if (ariaLabelledby && labelledbyElements) {
    return labelledbyElements.map(element => element.innerText).join(", ");
  }
  if (ariaLabel) {
    return field.getAttribute("aria-label");
  }
  return null;
}

/**
 * @desc Gets the field's appropriate label most relevant to the user reading the data. Falls back to the field's name or id if no label is found.
 * @param {HTMLInputElement|RadioNodeList|HTMLTextAreaElement|HTMLSelectElement} field 
 * @returns {string} 
 */
export function getFieldLabel(field) {
  const fallbackLabel = field.name || field.id || "";
  const isRadio = field instanceof RadioNodeList;
  
  field = isRadio ? field[0] : field;
  const legendElement = field.closest("fieldset")?.querySelector("legend");

  if (isRadio && legendElement) {
    return legendElement.innerText;
  }
  if (field.labels) {
    return [...field.labels].map(label => label.innerText).join(", ");
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
      return labels.map(label => label.innerText).join(", ");
    });
  }
  if (isSelect) {
    const selectedOptions = [...field.options].filter(option => option.selected);
    return selectedOptions.map(option => option.label).join(", ");
  }
  return fallbackValue;
}