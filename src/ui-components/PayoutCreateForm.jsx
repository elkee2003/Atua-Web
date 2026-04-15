/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  SelectField,
  TextField,
} from "@aws-amplify/ui-react";
import { Payout } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function PayoutCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    courierID: "",
    amount: "",
    status: "",
    bankName: "",
    accountNumber: "",
    reference: "",
    walletID: "",
  };
  const [courierID, setCourierID] = React.useState(initialValues.courierID);
  const [amount, setAmount] = React.useState(initialValues.amount);
  const [status, setStatus] = React.useState(initialValues.status);
  const [bankName, setBankName] = React.useState(initialValues.bankName);
  const [accountNumber, setAccountNumber] = React.useState(
    initialValues.accountNumber
  );
  const [reference, setReference] = React.useState(initialValues.reference);
  const [walletID, setWalletID] = React.useState(initialValues.walletID);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setCourierID(initialValues.courierID);
    setAmount(initialValues.amount);
    setStatus(initialValues.status);
    setBankName(initialValues.bankName);
    setAccountNumber(initialValues.accountNumber);
    setReference(initialValues.reference);
    setWalletID(initialValues.walletID);
    setErrors({});
  };
  const validations = {
    courierID: [{ type: "Required" }],
    amount: [{ type: "Required" }],
    status: [],
    bankName: [],
    accountNumber: [],
    reference: [],
    walletID: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          courierID,
          amount,
          status,
          bankName,
          accountNumber,
          reference,
          walletID,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await DataStore.save(new Payout(modelFields));
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            onError(modelFields, err.message);
          }
        }
      }}
      {...getOverrideProps(overrides, "PayoutCreateForm")}
      {...rest}
    >
      <TextField
        label="Courier id"
        isRequired={true}
        isReadOnly={false}
        value={courierID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID: value,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              walletID,
            };
            const result = onChange(modelFields);
            value = result?.courierID ?? value;
          }
          if (errors.courierID?.hasError) {
            runValidationTasks("courierID", value);
          }
          setCourierID(value);
        }}
        onBlur={() => runValidationTasks("courierID", courierID)}
        errorMessage={errors.courierID?.errorMessage}
        hasError={errors.courierID?.hasError}
        {...getOverrideProps(overrides, "courierID")}
      ></TextField>
      <TextField
        label="Amount"
        isRequired={true}
        isReadOnly={false}
        type="number"
        step="any"
        value={amount}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              courierID,
              amount: value,
              status,
              bankName,
              accountNumber,
              reference,
              walletID,
            };
            const result = onChange(modelFields);
            value = result?.amount ?? value;
          }
          if (errors.amount?.hasError) {
            runValidationTasks("amount", value);
          }
          setAmount(value);
        }}
        onBlur={() => runValidationTasks("amount", amount)}
        errorMessage={errors.amount?.errorMessage}
        hasError={errors.amount?.hasError}
        {...getOverrideProps(overrides, "amount")}
      ></TextField>
      <SelectField
        label="Status"
        placeholder="Please select an option"
        isDisabled={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              amount,
              status: value,
              bankName,
              accountNumber,
              reference,
              walletID,
            };
            const result = onChange(modelFields);
            value = result?.status ?? value;
          }
          if (errors.status?.hasError) {
            runValidationTasks("status", value);
          }
          setStatus(value);
        }}
        onBlur={() => runValidationTasks("status", status)}
        errorMessage={errors.status?.errorMessage}
        hasError={errors.status?.hasError}
        {...getOverrideProps(overrides, "status")}
      >
        <option
          children="Pending"
          value="PENDING"
          {...getOverrideProps(overrides, "statusoption0")}
        ></option>
        <option
          children="Processing"
          value="PROCESSING"
          {...getOverrideProps(overrides, "statusoption1")}
        ></option>
        <option
          children="Paid"
          value="PAID"
          {...getOverrideProps(overrides, "statusoption2")}
        ></option>
        <option
          children="Failed"
          value="FAILED"
          {...getOverrideProps(overrides, "statusoption3")}
        ></option>
      </SelectField>
      <TextField
        label="Bank name"
        isRequired={false}
        isReadOnly={false}
        value={bankName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              amount,
              status,
              bankName: value,
              accountNumber,
              reference,
              walletID,
            };
            const result = onChange(modelFields);
            value = result?.bankName ?? value;
          }
          if (errors.bankName?.hasError) {
            runValidationTasks("bankName", value);
          }
          setBankName(value);
        }}
        onBlur={() => runValidationTasks("bankName", bankName)}
        errorMessage={errors.bankName?.errorMessage}
        hasError={errors.bankName?.hasError}
        {...getOverrideProps(overrides, "bankName")}
      ></TextField>
      <TextField
        label="Account number"
        isRequired={false}
        isReadOnly={false}
        value={accountNumber}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              amount,
              status,
              bankName,
              accountNumber: value,
              reference,
              walletID,
            };
            const result = onChange(modelFields);
            value = result?.accountNumber ?? value;
          }
          if (errors.accountNumber?.hasError) {
            runValidationTasks("accountNumber", value);
          }
          setAccountNumber(value);
        }}
        onBlur={() => runValidationTasks("accountNumber", accountNumber)}
        errorMessage={errors.accountNumber?.errorMessage}
        hasError={errors.accountNumber?.hasError}
        {...getOverrideProps(overrides, "accountNumber")}
      ></TextField>
      <TextField
        label="Reference"
        isRequired={false}
        isReadOnly={false}
        value={reference}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              amount,
              status,
              bankName,
              accountNumber,
              reference: value,
              walletID,
            };
            const result = onChange(modelFields);
            value = result?.reference ?? value;
          }
          if (errors.reference?.hasError) {
            runValidationTasks("reference", value);
          }
          setReference(value);
        }}
        onBlur={() => runValidationTasks("reference", reference)}
        errorMessage={errors.reference?.errorMessage}
        hasError={errors.reference?.hasError}
        {...getOverrideProps(overrides, "reference")}
      ></TextField>
      <TextField
        label="Wallet id"
        isRequired={false}
        isReadOnly={false}
        value={walletID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              walletID: value,
            };
            const result = onChange(modelFields);
            value = result?.walletID ?? value;
          }
          if (errors.walletID?.hasError) {
            runValidationTasks("walletID", value);
          }
          setWalletID(value);
        }}
        onBlur={() => runValidationTasks("walletID", walletID)}
        errorMessage={errors.walletID?.errorMessage}
        hasError={errors.walletID?.hasError}
        {...getOverrideProps(overrides, "walletID")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
