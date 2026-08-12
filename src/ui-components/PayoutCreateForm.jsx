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
    walletID: "",
    amount: "",
    status: "",
    bankName: "",
    accountNumber: "",
    reference: "",
    transferCode: "",
    transferID: "",
    failureReason: "",
    payoutMethod: "",
    processedAt: "",
    paidAt: "",
    failedAt: "",
  };
  const [courierID, setCourierID] = React.useState(initialValues.courierID);
  const [walletID, setWalletID] = React.useState(initialValues.walletID);
  const [amount, setAmount] = React.useState(initialValues.amount);
  const [status, setStatus] = React.useState(initialValues.status);
  const [bankName, setBankName] = React.useState(initialValues.bankName);
  const [accountNumber, setAccountNumber] = React.useState(
    initialValues.accountNumber
  );
  const [reference, setReference] = React.useState(initialValues.reference);
  const [transferCode, setTransferCode] = React.useState(
    initialValues.transferCode
  );
  const [transferID, setTransferID] = React.useState(initialValues.transferID);
  const [failureReason, setFailureReason] = React.useState(
    initialValues.failureReason
  );
  const [payoutMethod, setPayoutMethod] = React.useState(
    initialValues.payoutMethod
  );
  const [processedAt, setProcessedAt] = React.useState(
    initialValues.processedAt
  );
  const [paidAt, setPaidAt] = React.useState(initialValues.paidAt);
  const [failedAt, setFailedAt] = React.useState(initialValues.failedAt);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setCourierID(initialValues.courierID);
    setWalletID(initialValues.walletID);
    setAmount(initialValues.amount);
    setStatus(initialValues.status);
    setBankName(initialValues.bankName);
    setAccountNumber(initialValues.accountNumber);
    setReference(initialValues.reference);
    setTransferCode(initialValues.transferCode);
    setTransferID(initialValues.transferID);
    setFailureReason(initialValues.failureReason);
    setPayoutMethod(initialValues.payoutMethod);
    setProcessedAt(initialValues.processedAt);
    setPaidAt(initialValues.paidAt);
    setFailedAt(initialValues.failedAt);
    setErrors({});
  };
  const validations = {
    courierID: [{ type: "Required" }],
    walletID: [],
    amount: [{ type: "Required" }],
    status: [],
    bankName: [],
    accountNumber: [],
    reference: [],
    transferCode: [],
    transferID: [],
    failureReason: [],
    payoutMethod: [],
    processedAt: [],
    paidAt: [],
    failedAt: [],
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
  const convertToLocal = (date) => {
    const df = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
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
          walletID,
          amount,
          status,
          bankName,
          accountNumber,
          reference,
          transferCode,
          transferID,
          failureReason,
          payoutMethod,
          processedAt,
          paidAt,
          failedAt,
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
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
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
        label="Wallet id"
        isRequired={false}
        isReadOnly={false}
        value={walletID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              walletID: value,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
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
              walletID,
              amount: value,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
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
              walletID,
              amount,
              status: value,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
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
              walletID,
              amount,
              status,
              bankName: value,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
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
              walletID,
              amount,
              status,
              bankName,
              accountNumber: value,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
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
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference: value,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
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
        label="Transfer code"
        isRequired={false}
        isReadOnly={false}
        value={transferCode}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode: value,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
            };
            const result = onChange(modelFields);
            value = result?.transferCode ?? value;
          }
          if (errors.transferCode?.hasError) {
            runValidationTasks("transferCode", value);
          }
          setTransferCode(value);
        }}
        onBlur={() => runValidationTasks("transferCode", transferCode)}
        errorMessage={errors.transferCode?.errorMessage}
        hasError={errors.transferCode?.hasError}
        {...getOverrideProps(overrides, "transferCode")}
      ></TextField>
      <TextField
        label="Transfer id"
        isRequired={false}
        isReadOnly={false}
        value={transferID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID: value,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
            };
            const result = onChange(modelFields);
            value = result?.transferID ?? value;
          }
          if (errors.transferID?.hasError) {
            runValidationTasks("transferID", value);
          }
          setTransferID(value);
        }}
        onBlur={() => runValidationTasks("transferID", transferID)}
        errorMessage={errors.transferID?.errorMessage}
        hasError={errors.transferID?.hasError}
        {...getOverrideProps(overrides, "transferID")}
      ></TextField>
      <TextField
        label="Failure reason"
        isRequired={false}
        isReadOnly={false}
        value={failureReason}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason: value,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt,
            };
            const result = onChange(modelFields);
            value = result?.failureReason ?? value;
          }
          if (errors.failureReason?.hasError) {
            runValidationTasks("failureReason", value);
          }
          setFailureReason(value);
        }}
        onBlur={() => runValidationTasks("failureReason", failureReason)}
        errorMessage={errors.failureReason?.errorMessage}
        hasError={errors.failureReason?.hasError}
        {...getOverrideProps(overrides, "failureReason")}
      ></TextField>
      <TextField
        label="Payout method"
        isRequired={false}
        isReadOnly={false}
        value={payoutMethod}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              courierID,
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod: value,
              processedAt,
              paidAt,
              failedAt,
            };
            const result = onChange(modelFields);
            value = result?.payoutMethod ?? value;
          }
          if (errors.payoutMethod?.hasError) {
            runValidationTasks("payoutMethod", value);
          }
          setPayoutMethod(value);
        }}
        onBlur={() => runValidationTasks("payoutMethod", payoutMethod)}
        errorMessage={errors.payoutMethod?.errorMessage}
        hasError={errors.payoutMethod?.hasError}
        {...getOverrideProps(overrides, "payoutMethod")}
      ></TextField>
      <TextField
        label="Processed at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={processedAt && convertToLocal(new Date(processedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              courierID,
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt: value,
              paidAt,
              failedAt,
            };
            const result = onChange(modelFields);
            value = result?.processedAt ?? value;
          }
          if (errors.processedAt?.hasError) {
            runValidationTasks("processedAt", value);
          }
          setProcessedAt(value);
        }}
        onBlur={() => runValidationTasks("processedAt", processedAt)}
        errorMessage={errors.processedAt?.errorMessage}
        hasError={errors.processedAt?.hasError}
        {...getOverrideProps(overrides, "processedAt")}
      ></TextField>
      <TextField
        label="Paid at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={paidAt && convertToLocal(new Date(paidAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              courierID,
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt: value,
              failedAt,
            };
            const result = onChange(modelFields);
            value = result?.paidAt ?? value;
          }
          if (errors.paidAt?.hasError) {
            runValidationTasks("paidAt", value);
          }
          setPaidAt(value);
        }}
        onBlur={() => runValidationTasks("paidAt", paidAt)}
        errorMessage={errors.paidAt?.errorMessage}
        hasError={errors.paidAt?.hasError}
        {...getOverrideProps(overrides, "paidAt")}
      ></TextField>
      <TextField
        label="Failed at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={failedAt && convertToLocal(new Date(failedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              courierID,
              walletID,
              amount,
              status,
              bankName,
              accountNumber,
              reference,
              transferCode,
              transferID,
              failureReason,
              payoutMethod,
              processedAt,
              paidAt,
              failedAt: value,
            };
            const result = onChange(modelFields);
            value = result?.failedAt ?? value;
          }
          if (errors.failedAt?.hasError) {
            runValidationTasks("failedAt", value);
          }
          setFailedAt(value);
        }}
        onBlur={() => runValidationTasks("failedAt", failedAt)}
        errorMessage={errors.failedAt?.errorMessage}
        hasError={errors.failedAt?.hasError}
        {...getOverrideProps(overrides, "failedAt")}
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
