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
import { Wallet } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function WalletUpdateForm(props) {
  const {
    id: idProp,
    wallet: walletModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    ownerID: "",
    ownerType: "",
    balance: "",
    pendingBalance: "",
    totalEarnings: "",
  };
  const [ownerID, setOwnerID] = React.useState(initialValues.ownerID);
  const [ownerType, setOwnerType] = React.useState(initialValues.ownerType);
  const [balance, setBalance] = React.useState(initialValues.balance);
  const [pendingBalance, setPendingBalance] = React.useState(
    initialValues.pendingBalance
  );
  const [totalEarnings, setTotalEarnings] = React.useState(
    initialValues.totalEarnings
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = walletRecord
      ? { ...initialValues, ...walletRecord }
      : initialValues;
    setOwnerID(cleanValues.ownerID);
    setOwnerType(cleanValues.ownerType);
    setBalance(cleanValues.balance);
    setPendingBalance(cleanValues.pendingBalance);
    setTotalEarnings(cleanValues.totalEarnings);
    setErrors({});
  };
  const [walletRecord, setWalletRecord] = React.useState(walletModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Wallet, idProp)
        : walletModelProp;
      setWalletRecord(record);
    };
    queryData();
  }, [idProp, walletModelProp]);
  React.useEffect(resetStateValues, [walletRecord]);
  const validations = {
    ownerID: [{ type: "Required" }],
    ownerType: [{ type: "Required" }],
    balance: [],
    pendingBalance: [],
    totalEarnings: [],
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
          ownerID,
          ownerType,
          balance,
          pendingBalance,
          totalEarnings,
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
            Wallet.copyOf(walletRecord, (updated) => {
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
      {...getOverrideProps(overrides, "WalletUpdateForm")}
      {...rest}
    >
      <TextField
        label="Owner id"
        isRequired={true}
        isReadOnly={false}
        value={ownerID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              ownerID: value,
              ownerType,
              balance,
              pendingBalance,
              totalEarnings,
            };
            const result = onChange(modelFields);
            value = result?.ownerID ?? value;
          }
          if (errors.ownerID?.hasError) {
            runValidationTasks("ownerID", value);
          }
          setOwnerID(value);
        }}
        onBlur={() => runValidationTasks("ownerID", ownerID)}
        errorMessage={errors.ownerID?.errorMessage}
        hasError={errors.ownerID?.hasError}
        {...getOverrideProps(overrides, "ownerID")}
      ></TextField>
      <SelectField
        label="Owner type"
        placeholder="Please select an option"
        isDisabled={false}
        value={ownerType}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              ownerID,
              ownerType: value,
              balance,
              pendingBalance,
              totalEarnings,
            };
            const result = onChange(modelFields);
            value = result?.ownerType ?? value;
          }
          if (errors.ownerType?.hasError) {
            runValidationTasks("ownerType", value);
          }
          setOwnerType(value);
        }}
        onBlur={() => runValidationTasks("ownerType", ownerType)}
        errorMessage={errors.ownerType?.errorMessage}
        hasError={errors.ownerType?.hasError}
        {...getOverrideProps(overrides, "ownerType")}
      >
        <option
          children="Courier"
          value="COURIER"
          {...getOverrideProps(overrides, "ownerTypeoption0")}
        ></option>
        <option
          children="User"
          value="USER"
          {...getOverrideProps(overrides, "ownerTypeoption1")}
        ></option>
      </SelectField>
      <TextField
        label="Balance"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={balance}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              ownerID,
              ownerType,
              balance: value,
              pendingBalance,
              totalEarnings,
            };
            const result = onChange(modelFields);
            value = result?.balance ?? value;
          }
          if (errors.balance?.hasError) {
            runValidationTasks("balance", value);
          }
          setBalance(value);
        }}
        onBlur={() => runValidationTasks("balance", balance)}
        errorMessage={errors.balance?.errorMessage}
        hasError={errors.balance?.hasError}
        {...getOverrideProps(overrides, "balance")}
      ></TextField>
      <TextField
        label="Pending balance"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={pendingBalance}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              ownerID,
              ownerType,
              balance,
              pendingBalance: value,
              totalEarnings,
            };
            const result = onChange(modelFields);
            value = result?.pendingBalance ?? value;
          }
          if (errors.pendingBalance?.hasError) {
            runValidationTasks("pendingBalance", value);
          }
          setPendingBalance(value);
        }}
        onBlur={() => runValidationTasks("pendingBalance", pendingBalance)}
        errorMessage={errors.pendingBalance?.errorMessage}
        hasError={errors.pendingBalance?.hasError}
        {...getOverrideProps(overrides, "pendingBalance")}
      ></TextField>
      <TextField
        label="Total earnings"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={totalEarnings}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              ownerID,
              ownerType,
              balance,
              pendingBalance,
              totalEarnings: value,
            };
            const result = onChange(modelFields);
            value = result?.totalEarnings ?? value;
          }
          if (errors.totalEarnings?.hasError) {
            runValidationTasks("totalEarnings", value);
          }
          setTotalEarnings(value);
        }}
        onBlur={() => runValidationTasks("totalEarnings", totalEarnings)}
        errorMessage={errors.totalEarnings?.errorMessage}
        hasError={errors.totalEarnings?.hasError}
        {...getOverrideProps(overrides, "totalEarnings")}
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
          isDisabled={!(idProp || walletModelProp)}
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
              !(idProp || walletModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
