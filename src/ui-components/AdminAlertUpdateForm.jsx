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
import { AdminAlert } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function AdminAlertUpdateForm(props) {
  const {
    id: idProp,
    adminAlert: adminAlertModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    type: "",
    title: "",
    message: "",
    severity: "",
    status: "",
    payoutID: "",
    payoutMethod: "",
    payoutSource: "",
    courierID: "",
    amount: "",
    courierObligations: "",
    paystackCosts: "",
    totalRequired: "",
    paystackBalance: "",
    topUpRequired: "",
    affectedCourierCount: "",
    createdAt: "",
    readAt: "",
    resolvedAt: "",
  };
  const [type, setType] = React.useState(initialValues.type);
  const [title, setTitle] = React.useState(initialValues.title);
  const [message, setMessage] = React.useState(initialValues.message);
  const [severity, setSeverity] = React.useState(initialValues.severity);
  const [status, setStatus] = React.useState(initialValues.status);
  const [payoutID, setPayoutID] = React.useState(initialValues.payoutID);
  const [payoutMethod, setPayoutMethod] = React.useState(
    initialValues.payoutMethod
  );
  const [payoutSource, setPayoutSource] = React.useState(
    initialValues.payoutSource
  );
  const [courierID, setCourierID] = React.useState(initialValues.courierID);
  const [amount, setAmount] = React.useState(initialValues.amount);
  const [courierObligations, setCourierObligations] = React.useState(
    initialValues.courierObligations
  );
  const [paystackCosts, setPaystackCosts] = React.useState(
    initialValues.paystackCosts
  );
  const [totalRequired, setTotalRequired] = React.useState(
    initialValues.totalRequired
  );
  const [paystackBalance, setPaystackBalance] = React.useState(
    initialValues.paystackBalance
  );
  const [topUpRequired, setTopUpRequired] = React.useState(
    initialValues.topUpRequired
  );
  const [affectedCourierCount, setAffectedCourierCount] = React.useState(
    initialValues.affectedCourierCount
  );
  const [createdAt, setCreatedAt] = React.useState(initialValues.createdAt);
  const [readAt, setReadAt] = React.useState(initialValues.readAt);
  const [resolvedAt, setResolvedAt] = React.useState(initialValues.resolvedAt);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = adminAlertRecord
      ? { ...initialValues, ...adminAlertRecord }
      : initialValues;
    setType(cleanValues.type);
    setTitle(cleanValues.title);
    setMessage(cleanValues.message);
    setSeverity(cleanValues.severity);
    setStatus(cleanValues.status);
    setPayoutID(cleanValues.payoutID);
    setPayoutMethod(cleanValues.payoutMethod);
    setPayoutSource(cleanValues.payoutSource);
    setCourierID(cleanValues.courierID);
    setAmount(cleanValues.amount);
    setCourierObligations(cleanValues.courierObligations);
    setPaystackCosts(cleanValues.paystackCosts);
    setTotalRequired(cleanValues.totalRequired);
    setPaystackBalance(cleanValues.paystackBalance);
    setTopUpRequired(cleanValues.topUpRequired);
    setAffectedCourierCount(cleanValues.affectedCourierCount);
    setCreatedAt(cleanValues.createdAt);
    setReadAt(cleanValues.readAt);
    setResolvedAt(cleanValues.resolvedAt);
    setErrors({});
  };
  const [adminAlertRecord, setAdminAlertRecord] =
    React.useState(adminAlertModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(AdminAlert, idProp)
        : adminAlertModelProp;
      setAdminAlertRecord(record);
    };
    queryData();
  }, [idProp, adminAlertModelProp]);
  React.useEffect(resetStateValues, [adminAlertRecord]);
  const validations = {
    type: [{ type: "Required" }],
    title: [{ type: "Required" }],
    message: [{ type: "Required" }],
    severity: [{ type: "Required" }],
    status: [{ type: "Required" }],
    payoutID: [],
    payoutMethod: [],
    payoutSource: [],
    courierID: [],
    amount: [],
    courierObligations: [],
    paystackCosts: [],
    totalRequired: [],
    paystackBalance: [],
    topUpRequired: [],
    affectedCourierCount: [],
    createdAt: [{ type: "Required" }],
    readAt: [],
    resolvedAt: [],
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
          type,
          title,
          message,
          severity,
          status,
          payoutID,
          payoutMethod,
          payoutSource,
          courierID,
          amount,
          courierObligations,
          paystackCosts,
          totalRequired,
          paystackBalance,
          topUpRequired,
          affectedCourierCount,
          createdAt,
          readAt,
          resolvedAt,
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
          await DataStore.save(
            AdminAlert.copyOf(adminAlertRecord, (updated) => {
              Object.assign(updated, modelFields);
            })
          );
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            onError(modelFields, err.message);
          }
        }
      }}
      {...getOverrideProps(overrides, "AdminAlertUpdateForm")}
      {...rest}
    >
      <TextField
        label="Type"
        isRequired={true}
        isReadOnly={false}
        value={type}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              type: value,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.type ?? value;
          }
          if (errors.type?.hasError) {
            runValidationTasks("type", value);
          }
          setType(value);
        }}
        onBlur={() => runValidationTasks("type", type)}
        errorMessage={errors.type?.errorMessage}
        hasError={errors.type?.hasError}
        {...getOverrideProps(overrides, "type")}
      ></TextField>
      <TextField
        label="Title"
        isRequired={true}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              type,
              title: value,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.title ?? value;
          }
          if (errors.title?.hasError) {
            runValidationTasks("title", value);
          }
          setTitle(value);
        }}
        onBlur={() => runValidationTasks("title", title)}
        errorMessage={errors.title?.errorMessage}
        hasError={errors.title?.hasError}
        {...getOverrideProps(overrides, "title")}
      ></TextField>
      <TextField
        label="Message"
        isRequired={true}
        isReadOnly={false}
        value={message}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              type,
              title,
              message: value,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.message ?? value;
          }
          if (errors.message?.hasError) {
            runValidationTasks("message", value);
          }
          setMessage(value);
        }}
        onBlur={() => runValidationTasks("message", message)}
        errorMessage={errors.message?.errorMessage}
        hasError={errors.message?.hasError}
        {...getOverrideProps(overrides, "message")}
      ></TextField>
      <TextField
        label="Severity"
        isRequired={true}
        isReadOnly={false}
        value={severity}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity: value,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.severity ?? value;
          }
          if (errors.severity?.hasError) {
            runValidationTasks("severity", value);
          }
          setSeverity(value);
        }}
        onBlur={() => runValidationTasks("severity", severity)}
        errorMessage={errors.severity?.errorMessage}
        hasError={errors.severity?.hasError}
        {...getOverrideProps(overrides, "severity")}
      ></TextField>
      <TextField
        label="Status"
        isRequired={true}
        isReadOnly={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status: value,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
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
      ></TextField>
      <TextField
        label="Payout id"
        isRequired={false}
        isReadOnly={false}
        value={payoutID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID: value,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.payoutID ?? value;
          }
          if (errors.payoutID?.hasError) {
            runValidationTasks("payoutID", value);
          }
          setPayoutID(value);
        }}
        onBlur={() => runValidationTasks("payoutID", payoutID)}
        errorMessage={errors.payoutID?.errorMessage}
        hasError={errors.payoutID?.hasError}
        {...getOverrideProps(overrides, "payoutID")}
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
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod: value,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
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
      <SelectField
        label="Payout source"
        placeholder="Please select an option"
        isDisabled={false}
        value={payoutSource}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource: value,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.payoutSource ?? value;
          }
          if (errors.payoutSource?.hasError) {
            runValidationTasks("payoutSource", value);
          }
          setPayoutSource(value);
        }}
        onBlur={() => runValidationTasks("payoutSource", payoutSource)}
        errorMessage={errors.payoutSource?.errorMessage}
        hasError={errors.payoutSource?.hasError}
        {...getOverrideProps(overrides, "payoutSource")}
      >
        <option
          children="Courier requested"
          value="COURIER_REQUESTED"
          {...getOverrideProps(overrides, "payoutSourceoption0")}
        ></option>
        <option
          children="Admin manual"
          value="ADMIN_MANUAL"
          {...getOverrideProps(overrides, "payoutSourceoption1")}
        ></option>
        <option
          children="System"
          value="SYSTEM"
          {...getOverrideProps(overrides, "payoutSourceoption2")}
        ></option>
      </SelectField>
      <TextField
        label="Courier id"
        isRequired={false}
        isReadOnly={false}
        value={courierID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID: value,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
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
        isRequired={false}
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
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount: value,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
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
      <TextField
        label="Courier obligations"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={courierObligations}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations: value,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.courierObligations ?? value;
          }
          if (errors.courierObligations?.hasError) {
            runValidationTasks("courierObligations", value);
          }
          setCourierObligations(value);
        }}
        onBlur={() =>
          runValidationTasks("courierObligations", courierObligations)
        }
        errorMessage={errors.courierObligations?.errorMessage}
        hasError={errors.courierObligations?.hasError}
        {...getOverrideProps(overrides, "courierObligations")}
      ></TextField>
      <TextField
        label="Paystack costs"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={paystackCosts}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts: value,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.paystackCosts ?? value;
          }
          if (errors.paystackCosts?.hasError) {
            runValidationTasks("paystackCosts", value);
          }
          setPaystackCosts(value);
        }}
        onBlur={() => runValidationTasks("paystackCosts", paystackCosts)}
        errorMessage={errors.paystackCosts?.errorMessage}
        hasError={errors.paystackCosts?.hasError}
        {...getOverrideProps(overrides, "paystackCosts")}
      ></TextField>
      <TextField
        label="Total required"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={totalRequired}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired: value,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.totalRequired ?? value;
          }
          if (errors.totalRequired?.hasError) {
            runValidationTasks("totalRequired", value);
          }
          setTotalRequired(value);
        }}
        onBlur={() => runValidationTasks("totalRequired", totalRequired)}
        errorMessage={errors.totalRequired?.errorMessage}
        hasError={errors.totalRequired?.hasError}
        {...getOverrideProps(overrides, "totalRequired")}
      ></TextField>
      <TextField
        label="Paystack balance"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={paystackBalance}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance: value,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.paystackBalance ?? value;
          }
          if (errors.paystackBalance?.hasError) {
            runValidationTasks("paystackBalance", value);
          }
          setPaystackBalance(value);
        }}
        onBlur={() => runValidationTasks("paystackBalance", paystackBalance)}
        errorMessage={errors.paystackBalance?.errorMessage}
        hasError={errors.paystackBalance?.hasError}
        {...getOverrideProps(overrides, "paystackBalance")}
      ></TextField>
      <TextField
        label="Top up required"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={topUpRequired}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired: value,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.topUpRequired ?? value;
          }
          if (errors.topUpRequired?.hasError) {
            runValidationTasks("topUpRequired", value);
          }
          setTopUpRequired(value);
        }}
        onBlur={() => runValidationTasks("topUpRequired", topUpRequired)}
        errorMessage={errors.topUpRequired?.errorMessage}
        hasError={errors.topUpRequired?.hasError}
        {...getOverrideProps(overrides, "topUpRequired")}
      ></TextField>
      <TextField
        label="Affected courier count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={affectedCourierCount}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount: value,
              createdAt,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.affectedCourierCount ?? value;
          }
          if (errors.affectedCourierCount?.hasError) {
            runValidationTasks("affectedCourierCount", value);
          }
          setAffectedCourierCount(value);
        }}
        onBlur={() =>
          runValidationTasks("affectedCourierCount", affectedCourierCount)
        }
        errorMessage={errors.affectedCourierCount?.errorMessage}
        hasError={errors.affectedCourierCount?.hasError}
        {...getOverrideProps(overrides, "affectedCourierCount")}
      ></TextField>
      <TextField
        label="Created at"
        isRequired={true}
        isReadOnly={false}
        type="datetime-local"
        value={createdAt && convertToLocal(new Date(createdAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt: value,
              readAt,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.createdAt ?? value;
          }
          if (errors.createdAt?.hasError) {
            runValidationTasks("createdAt", value);
          }
          setCreatedAt(value);
        }}
        onBlur={() => runValidationTasks("createdAt", createdAt)}
        errorMessage={errors.createdAt?.errorMessage}
        hasError={errors.createdAt?.hasError}
        {...getOverrideProps(overrides, "createdAt")}
      ></TextField>
      <TextField
        label="Read at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={readAt && convertToLocal(new Date(readAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt: value,
              resolvedAt,
            };
            const result = onChange(modelFields);
            value = result?.readAt ?? value;
          }
          if (errors.readAt?.hasError) {
            runValidationTasks("readAt", value);
          }
          setReadAt(value);
        }}
        onBlur={() => runValidationTasks("readAt", readAt)}
        errorMessage={errors.readAt?.errorMessage}
        hasError={errors.readAt?.hasError}
        {...getOverrideProps(overrides, "readAt")}
      ></TextField>
      <TextField
        label="Resolved at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={resolvedAt && convertToLocal(new Date(resolvedAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              type,
              title,
              message,
              severity,
              status,
              payoutID,
              payoutMethod,
              payoutSource,
              courierID,
              amount,
              courierObligations,
              paystackCosts,
              totalRequired,
              paystackBalance,
              topUpRequired,
              affectedCourierCount,
              createdAt,
              readAt,
              resolvedAt: value,
            };
            const result = onChange(modelFields);
            value = result?.resolvedAt ?? value;
          }
          if (errors.resolvedAt?.hasError) {
            runValidationTasks("resolvedAt", value);
          }
          setResolvedAt(value);
        }}
        onBlur={() => runValidationTasks("resolvedAt", resolvedAt)}
        errorMessage={errors.resolvedAt?.errorMessage}
        hasError={errors.resolvedAt?.hasError}
        {...getOverrideProps(overrides, "resolvedAt")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || adminAlertModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || adminAlertModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
