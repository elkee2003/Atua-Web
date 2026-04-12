/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Button, Flex, Grid, TextField } from "@aws-amplify/ui-react";
import { CourierCompany } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function CourierCompanyUpdateForm(props) {
  const {
    id: idProp,
    courierCompany: courierCompanyModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    sub: "",
    firstName: "",
    lastName: "",
    profilePic: "",
    address: "",
    lat: "",
    lng: "",
    landmark: "",
    phoneNumber: "",
    email: "",
    adminFirstName: "",
    adminLastName: "",
    adminPhoneNumber: "",
    bankName: "",
    accountNumber: "",
    push_token: "",
  };
  const [sub, setSub] = React.useState(initialValues.sub);
  const [firstName, setFirstName] = React.useState(initialValues.firstName);
  const [lastName, setLastName] = React.useState(initialValues.lastName);
  const [profilePic, setProfilePic] = React.useState(initialValues.profilePic);
  const [address, setAddress] = React.useState(initialValues.address);
  const [lat, setLat] = React.useState(initialValues.lat);
  const [lng, setLng] = React.useState(initialValues.lng);
  const [landmark, setLandmark] = React.useState(initialValues.landmark);
  const [phoneNumber, setPhoneNumber] = React.useState(
    initialValues.phoneNumber
  );
  const [email, setEmail] = React.useState(initialValues.email);
  const [adminFirstName, setAdminFirstName] = React.useState(
    initialValues.adminFirstName
  );
  const [adminLastName, setAdminLastName] = React.useState(
    initialValues.adminLastName
  );
  const [adminPhoneNumber, setAdminPhoneNumber] = React.useState(
    initialValues.adminPhoneNumber
  );
  const [bankName, setBankName] = React.useState(initialValues.bankName);
  const [accountNumber, setAccountNumber] = React.useState(
    initialValues.accountNumber
  );
  const [push_token, setPush_token] = React.useState(initialValues.push_token);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = courierCompanyRecord
      ? { ...initialValues, ...courierCompanyRecord }
      : initialValues;
    setSub(cleanValues.sub);
    setFirstName(cleanValues.firstName);
    setLastName(cleanValues.lastName);
    setProfilePic(cleanValues.profilePic);
    setAddress(cleanValues.address);
    setLat(cleanValues.lat);
    setLng(cleanValues.lng);
    setLandmark(cleanValues.landmark);
    setPhoneNumber(cleanValues.phoneNumber);
    setEmail(cleanValues.email);
    setAdminFirstName(cleanValues.adminFirstName);
    setAdminLastName(cleanValues.adminLastName);
    setAdminPhoneNumber(cleanValues.adminPhoneNumber);
    setBankName(cleanValues.bankName);
    setAccountNumber(cleanValues.accountNumber);
    setPush_token(cleanValues.push_token);
    setErrors({});
  };
  const [courierCompanyRecord, setCourierCompanyRecord] = React.useState(
    courierCompanyModelProp
  );
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(CourierCompany, idProp)
        : courierCompanyModelProp;
      setCourierCompanyRecord(record);
    };
    queryData();
  }, [idProp, courierCompanyModelProp]);
  React.useEffect(resetStateValues, [courierCompanyRecord]);
  const validations = {
    sub: [{ type: "Required" }],
    firstName: [{ type: "Required" }],
    lastName: [],
    profilePic: [],
    address: [],
    lat: [],
    lng: [],
    landmark: [],
    phoneNumber: [],
    email: [],
    adminFirstName: [],
    adminLastName: [],
    adminPhoneNumber: [],
    bankName: [],
    accountNumber: [],
    push_token: [],
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
          sub,
          firstName,
          lastName,
          profilePic,
          address,
          lat,
          lng,
          landmark,
          phoneNumber,
          email,
          adminFirstName,
          adminLastName,
          adminPhoneNumber,
          bankName,
          accountNumber,
          push_token,
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
            CourierCompany.copyOf(courierCompanyRecord, (updated) => {
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
      {...getOverrideProps(overrides, "CourierCompanyUpdateForm")}
      {...rest}
    >
      <TextField
        label="Sub"
        isRequired={true}
        isReadOnly={false}
        value={sub}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub: value,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.sub ?? value;
          }
          if (errors.sub?.hasError) {
            runValidationTasks("sub", value);
          }
          setSub(value);
        }}
        onBlur={() => runValidationTasks("sub", sub)}
        errorMessage={errors.sub?.errorMessage}
        hasError={errors.sub?.hasError}
        {...getOverrideProps(overrides, "sub")}
      ></TextField>
      <TextField
        label="First name"
        isRequired={true}
        isReadOnly={false}
        value={firstName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName: value,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.firstName ?? value;
          }
          if (errors.firstName?.hasError) {
            runValidationTasks("firstName", value);
          }
          setFirstName(value);
        }}
        onBlur={() => runValidationTasks("firstName", firstName)}
        errorMessage={errors.firstName?.errorMessage}
        hasError={errors.firstName?.hasError}
        {...getOverrideProps(overrides, "firstName")}
      ></TextField>
      <TextField
        label="Last name"
        isRequired={false}
        isReadOnly={false}
        value={lastName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName: value,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.lastName ?? value;
          }
          if (errors.lastName?.hasError) {
            runValidationTasks("lastName", value);
          }
          setLastName(value);
        }}
        onBlur={() => runValidationTasks("lastName", lastName)}
        errorMessage={errors.lastName?.errorMessage}
        hasError={errors.lastName?.hasError}
        {...getOverrideProps(overrides, "lastName")}
      ></TextField>
      <TextField
        label="Profile pic"
        isRequired={false}
        isReadOnly={false}
        value={profilePic}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic: value,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.profilePic ?? value;
          }
          if (errors.profilePic?.hasError) {
            runValidationTasks("profilePic", value);
          }
          setProfilePic(value);
        }}
        onBlur={() => runValidationTasks("profilePic", profilePic)}
        errorMessage={errors.profilePic?.errorMessage}
        hasError={errors.profilePic?.hasError}
        {...getOverrideProps(overrides, "profilePic")}
      ></TextField>
      <TextField
        label="Address"
        isRequired={false}
        isReadOnly={false}
        value={address}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address: value,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.address ?? value;
          }
          if (errors.address?.hasError) {
            runValidationTasks("address", value);
          }
          setAddress(value);
        }}
        onBlur={() => runValidationTasks("address", address)}
        errorMessage={errors.address?.errorMessage}
        hasError={errors.address?.hasError}
        {...getOverrideProps(overrides, "address")}
      ></TextField>
      <TextField
        label="Lat"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={lat}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat: value,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.lat ?? value;
          }
          if (errors.lat?.hasError) {
            runValidationTasks("lat", value);
          }
          setLat(value);
        }}
        onBlur={() => runValidationTasks("lat", lat)}
        errorMessage={errors.lat?.errorMessage}
        hasError={errors.lat?.hasError}
        {...getOverrideProps(overrides, "lat")}
      ></TextField>
      <TextField
        label="Lng"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={lng}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng: value,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.lng ?? value;
          }
          if (errors.lng?.hasError) {
            runValidationTasks("lng", value);
          }
          setLng(value);
        }}
        onBlur={() => runValidationTasks("lng", lng)}
        errorMessage={errors.lng?.errorMessage}
        hasError={errors.lng?.hasError}
        {...getOverrideProps(overrides, "lng")}
      ></TextField>
      <TextField
        label="Landmark"
        isRequired={false}
        isReadOnly={false}
        value={landmark}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark: value,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.landmark ?? value;
          }
          if (errors.landmark?.hasError) {
            runValidationTasks("landmark", value);
          }
          setLandmark(value);
        }}
        onBlur={() => runValidationTasks("landmark", landmark)}
        errorMessage={errors.landmark?.errorMessage}
        hasError={errors.landmark?.hasError}
        {...getOverrideProps(overrides, "landmark")}
      ></TextField>
      <TextField
        label="Phone number"
        isRequired={false}
        isReadOnly={false}
        value={phoneNumber}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber: value,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.phoneNumber ?? value;
          }
          if (errors.phoneNumber?.hasError) {
            runValidationTasks("phoneNumber", value);
          }
          setPhoneNumber(value);
        }}
        onBlur={() => runValidationTasks("phoneNumber", phoneNumber)}
        errorMessage={errors.phoneNumber?.errorMessage}
        hasError={errors.phoneNumber?.hasError}
        {...getOverrideProps(overrides, "phoneNumber")}
      ></TextField>
      <TextField
        label="Email"
        isRequired={false}
        isReadOnly={false}
        value={email}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email: value,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.email ?? value;
          }
          if (errors.email?.hasError) {
            runValidationTasks("email", value);
          }
          setEmail(value);
        }}
        onBlur={() => runValidationTasks("email", email)}
        errorMessage={errors.email?.errorMessage}
        hasError={errors.email?.hasError}
        {...getOverrideProps(overrides, "email")}
      ></TextField>
      <TextField
        label="Admin first name"
        isRequired={false}
        isReadOnly={false}
        value={adminFirstName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName: value,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.adminFirstName ?? value;
          }
          if (errors.adminFirstName?.hasError) {
            runValidationTasks("adminFirstName", value);
          }
          setAdminFirstName(value);
        }}
        onBlur={() => runValidationTasks("adminFirstName", adminFirstName)}
        errorMessage={errors.adminFirstName?.errorMessage}
        hasError={errors.adminFirstName?.hasError}
        {...getOverrideProps(overrides, "adminFirstName")}
      ></TextField>
      <TextField
        label="Admin last name"
        isRequired={false}
        isReadOnly={false}
        value={adminLastName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName: value,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.adminLastName ?? value;
          }
          if (errors.adminLastName?.hasError) {
            runValidationTasks("adminLastName", value);
          }
          setAdminLastName(value);
        }}
        onBlur={() => runValidationTasks("adminLastName", adminLastName)}
        errorMessage={errors.adminLastName?.errorMessage}
        hasError={errors.adminLastName?.hasError}
        {...getOverrideProps(overrides, "adminLastName")}
      ></TextField>
      <TextField
        label="Admin phone number"
        isRequired={false}
        isReadOnly={false}
        value={adminPhoneNumber}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber: value,
              bankName,
              accountNumber,
              push_token,
            };
            const result = onChange(modelFields);
            value = result?.adminPhoneNumber ?? value;
          }
          if (errors.adminPhoneNumber?.hasError) {
            runValidationTasks("adminPhoneNumber", value);
          }
          setAdminPhoneNumber(value);
        }}
        onBlur={() => runValidationTasks("adminPhoneNumber", adminPhoneNumber)}
        errorMessage={errors.adminPhoneNumber?.errorMessage}
        hasError={errors.adminPhoneNumber?.hasError}
        {...getOverrideProps(overrides, "adminPhoneNumber")}
      ></TextField>
      <TextField
        label="Bank name"
        isRequired={false}
        isReadOnly={false}
        value={bankName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName: value,
              accountNumber,
              push_token,
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
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber: value,
              push_token,
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
        label="Push token"
        isRequired={false}
        isReadOnly={false}
        value={push_token}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              sub,
              firstName,
              lastName,
              profilePic,
              address,
              lat,
              lng,
              landmark,
              phoneNumber,
              email,
              adminFirstName,
              adminLastName,
              adminPhoneNumber,
              bankName,
              accountNumber,
              push_token: value,
            };
            const result = onChange(modelFields);
            value = result?.push_token ?? value;
          }
          if (errors.push_token?.hasError) {
            runValidationTasks("push_token", value);
          }
          setPush_token(value);
        }}
        onBlur={() => runValidationTasks("push_token", push_token)}
        errorMessage={errors.push_token?.errorMessage}
        hasError={errors.push_token?.hasError}
        {...getOverrideProps(overrides, "push_token")}
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
          isDisabled={!(idProp || courierCompanyModelProp)}
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
              !(idProp || courierCompanyModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
