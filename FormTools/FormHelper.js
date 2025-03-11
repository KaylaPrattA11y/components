/* eslint-disable no-console */
import { validityStateToString } from "./utilities";

/**
 * @desc A class that provides methods for managing and debugging forms and form elements
 * @class FormHelper
 */
export default class FormHelper {
  /**
   * @param {HTMLFormElement} formElement
	 * @returns {Object} the FormData as an object
   */
  static getFormDataObject(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    formData.forEach((value, name) => {
      data[name] = value;
    });
    return data;
  }

  /**
   * @param {HTMLFormElement} formElement
	 * @returns {Object[]} the FormData as an array of objects
   */
  static getFormDataArray(formElement) {
    const formData = new FormData(formElement);
    const data = [];
    formData.forEach((value, name) => {
      data.push({ name, value });
    });
    return data;
  }

  /**
   * @desc Logs the `FormData` of a given form element to the console
   * @param {HTMLFormElement} formElement
   */
  static logFormData(formElement) {
    console.table(FormHelper.getFormDataArray(formElement));
  }

  /**
   * @desc Get the form submit button
   * @param {HTMLFormElement} formElement
   * @returns {HTMLButtonElement | HTMLInputElement} The submit button element
   */
  static getSubmit(formElement) {
    return formElement?.querySelector("button[type=submit]");
  }

  /**
   * @desc Disable or enable the form submit button
   * @param {HTMLFormElement} formElement
   * @param {boolean} doDisable default `true`
   */
  static disableSubmit(formElement, doDisable = true) {
    const submitButton = formElement?.querySelector("button[type=submit]");
    submitButton?.toggleAttribute("disabled", doDisable);
  }

  /**
   * @desc Make all applicable form elements within the form or fieldset disabled
   * @param {HTMLFormElement | HTMLFieldSetElement} formElement The <form|fieldset> container
   * @param {boolean} doDisable default `true`
   */
  static disableAllElements(formElement, doDisable = true) {
    const canBeDisabled = () => 
      formElement instanceof HTMLFieldSetElement 
      || formElement instanceof HTMLInputElement 
      || formElement instanceof HTMLTextAreaElement 
      || formElement instanceof HTMLSelectElement;
    const filtered = [...formElement.elements].filter(element => canBeDisabled(element));

    filtered.forEach(element => {
      const el = element;
      el.disabled = doDisable;
    });
  }

  /**
   * @desc Make all applicable form elements within the form or fieldset read-only
   * @param {HTMLFormElement | HTMLFieldSetElement} formElement The <form|fieldset> container
   * @param {boolean} doReadOnly default `true`
   */
  static makeAllElementsReadonly(formElement, doReadOnly = true) {
    const canBeReadOnly = () => 
      formElement instanceof HTMLInputElement 
      || formElement instanceof HTMLTextAreaElement;
    const filtered = [...formElement.elements].filter(element => canBeReadOnly(element));

    filtered.forEach(element => {
      const el = element;
      el.readOnly = doReadOnly;
    });
  }

  /**
   * @desc Show or hide the form submit button's loading spinner. Disables the button when shown
   * @param {HTMLFormElement} formElement
   * @param {boolean} doShow default `true`
   */
  static showSubmitLoader(formElement, doShow = true) {
    const submitButton = formElement?.querySelector("button[type=submit]");
    submitButton?.toggleAttribute("disabled", doShow);
    submitButton?.toggleAttribute("data-is-busy", doShow);
  }

  /**
   * @desc Compares two FormData objects to see if they are equal. Use an initial form data object and a new form data object to determine if the form state is "clean" (`true`) or "dirty" (`false`).
   * @param {FormData} formData1
   * @param {FormData} formData2
   * @returns `true` if the two FormData objects are equal, `false` otherwise.
   */
  static formDataMatches(formData1, formData2) {
    const entries1 = [...formData1.entries()];
    const entries2 = [...formData2.entries()];

    if (entries1.length !== entries2.length) return false;

    return entries1.every(([key, value]) => {
      const matchingEntry = entries2.find(([key2]) => key === key2);
      return matchingEntry && value === matchingEntry[1];
    });
  }

  /**
   * @desc Returns all invalid form elements
   * @param {HTMLFormElement} formElement
   * * @param {string[] | "badInput" | "customError" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valueMissing"} validityState An array of validity states to filter the invalid fields by. Leave empty to log all invalid fields.
   * @param {boolean} excludeDisabledFields If true, excludes disabled fields from the list of invalid fields. Default is true.
   * @returns {HTMLInputElement[] | HTMLSelectElement[] | HTMLTextAreaElement[]}
   */
  static getInvalidFields(formElement, validityState = [], excludeDisabledFields = true) {
    let invalidFields = [...formElement.elements].filter(element => !element.validity.valid);
    if (excludeDisabledFields) {
      invalidFields = invalidFields.filter(field => !field.disabled);
    }
    if (validityState.length > 0) {
      invalidFields = invalidFields.filter(field => validityState.some(state => field.validity[state]));
    }
    return invalidFields;
  }

  /**
   * @desc Returns all invalid form elements, along with their names, values, and validation messages
   * @param {HTMLFormElement} formElement
   * @param {string[] | "badInput" | "customError" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valueMissing"} validityState An array of validity states to filter the invalid fields by. Leave empty to log all invalid fields.
   * @param {boolean} excludeDisabledFields If true, excludes disabled fields from the list of invalid fields. Default is true.
   * @returns {object[]}
   */
  static getInvalidFieldsData(formElement, validityState = [], excludeDisabledFields = true) {
    return FormHelper.getInvalidFields(formElement, validityState, excludeDisabledFields).map(field => ({
      name: field.name,
      value: field.value,
      validity: validityStateToString(field),
      validationMessage: field.validationMessage,
    }));
  }

  /**
   * @desc Logs the invalid form fields data to the console
   * @param {HTMLFormElement} formElement 
   * @param {string[] | "badInput" | "customError" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valueMissing"} validityState An array of validity states to filter the invalid fields by. Leave empty to log all invalid fields.
   * @param {boolean} excludeDisabledFields If true, excludes disabled fields from the list of invalid fields. Default is true.
   */
  static logInvalidFieldsData(formElement, validityState = [], excludeDisabledFields = true) {
    console.table(FormHelper.getInvalidFieldsData(formElement, validityState, excludeDisabledFields));
  }

  /**
   * @desc Returns all required form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[] | HTMLSelectElement[] | HTMLTextAreaElement[]}
   */
  static getRequiredFields(formElement) {
    return [...formElement.elements].filter(element => element.required);
  }

  /**
   * @desc Returns all disabled form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[] | HTMLSelectElement[] | HTMLTextAreaElement[]}
   */
  static getDisabledFields(formElement) {
    return [...formElement.elements].filter(element => element.disabled);
  }

  /**
   * @desc Returns all readonly form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[] | HTMLSelectElement[] | HTMLTextAreaElement[]}
   */
  static getReadonlyFields(formElement) {
    return [...formElement.elements].filter(element => element.readOnly);
  }

  /**
   * @desc Returns all form fieldset elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLFieldSetElement[]}
   */
  static getFieldsets(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "FIELDSET");
  }

  /**
   * @desc Returns data about every `<fieldset>` within the form element
   * @param {HTMLFormElement} formElement
   * @returns {Object[]}
   */
  static getFieldsetsData(formElement) {
    const fieldsetElements = FormHelper.getFieldsets(formElement);
    return [...fieldsetElements].map(fieldset => ({
      element: fieldset,
      legend: fieldset.querySelector("legend"),
      legendText: fieldset.querySelector("legend")?.innerText,
      invalid: fieldset.matches(":invalid"),
    }));
  }

  /**
   * @desc Returns all `<input>` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllInputs(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "INPUT");
  }

  /**
   * @desc Returns all `<textarea>` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLTextAreaElement[]}
   */
  static getAllTextareas(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "TEXTAREA");
  }

  /**
   * @desc Returns all `<select>` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLSelectElement[]}
   */
  static getAllSelects(formElement) {
    return [...formElement.elements].filter(element => element.tagName === "SELECT");
  }

  /**
   * @desc Returns all `input[type="number"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllNumberInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "number");
  }

  /**
   * @desc Returns all `input[type="email"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllEmailInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "email");
  }

  /**
   * @desc Returns all `input[type="hidden"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllHiddenInputs(formElement) {
    return [...formElement.elements].filter(element => element.type === "hidden");
  }

  /**
   * @desc Returns all `input[type="checkbox"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllCheckboxes(formElement) {
    return [...formElement.elements].filter(element => element.type === "checkbox");
  }

  /**
   * @desc Returns all `input[type="radio"]` form elements
   * @param {HTMLFormElement} formElement
   * @returns {HTMLInputElement[]}
   */
  static getAllRadios(formElement) {
    return [...formElement.elements].filter(element => element.type === "radio");
  }

  /**
   * @desc Clears the custom validity message for all form elements
   * @param {HTMLFormElement} formElement 
   */
  static clearAllCustomValidity(formElement) {
    [...formElement.elements].forEach(element => {
      element.setCustomValidity("");
    });
  }

  /**
   * @desc Initializes the defaultValue properties of form elements to match their current values
   * @param {HTMLFormElement} formElement
   */
  static initializeDefaultValues(formElement) {
    [...formElement.elements].forEach(element => {
      const el = element;
      el.defaultValue = element.value;
    });
  }

  /**
   * @desc Determines whether a form is "dirty" or "clean" by comparing the default values of the form elements to their current values
   * @param {HTMLFormElement} formElement 
   * @returns {boolean} `true` if the form is dirty, `false` if the form is clean
   */
  static isDirty(formElement) {
    const allDefaultValues = [...formElement.elements].map(element => element.defaultValue == null ? "" : element.defaultValue);
    const allCurrentValues = [...formElement.elements].map(element => element.value == null ? "" : element.value);
    return !allDefaultValues.every((defaultValue, index) => defaultValue === allCurrentValues[index]);
  }

  /**
   * @desc Populates a form element with data from an object
   * @param {HTMLFormElement} formElement 
   * @param {object} obj The object containing the data to populate the form fields with, ex: `{ firstName: "Julie", age: "31" }`
   * @param {boolean} setAsDefaultValues If true, sets the default values of the form fields to the values in the data object. Default is true.
   */
  static populateFormFieldsWithObject(formElement, obj, setAsDefaultValues = true) {
    Object.entries(obj).forEach(([key, value]) => {
      const element = formElement.elements.namedItem(key);
      const isRadio = element instanceof RadioNodeList;
      const isSelect = element instanceof HTMLSelectElement;

      if (!element) return;
      if (isRadio) {
        const radio = [...element].find(r => r.value === value);
        if (radio) {
          radio.checked = true;
        }
      } else if (isSelect) {
        element.value = value;
        const option = element.options[element.selectedIndex];
        if (option) {
          option.selected = true;
        }
      } else {
        element.value = value;
      }
      if (setAsDefaultValues) {
        element.defaultValue = value;
      }
    });
  }
}