/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type CourierCreateFormInputValues = {
    sub?: string;
    isOnline?: boolean;
    firstName?: string;
    lastName?: string;
    profilePic?: string;
    address?: string;
    landMark?: string;
    phoneNumber?: string;
    email?: string;
    courierNIN?: string;
    courierBVN?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    transportationType?: string;
    vehicleType?: string;
    model?: string;
    plateNumber?: string;
    maxiImages?: string[];
    maxiTransportPrice?: number;
    guarantorName?: string;
    guarantorLastName?: string;
    guarantorProfession?: string;
    guarantorNumber?: string;
    guarantorRelationship?: string;
    guarantorAddress?: string;
    guarantorEmail?: string;
    guarantorNIN?: string;
    lat?: number;
    lng?: number;
    heading?: number;
    push_token?: string;
};
export declare type CourierCreateFormValidationValues = {
    sub?: ValidationFunction<string>;
    isOnline?: ValidationFunction<boolean>;
    firstName?: ValidationFunction<string>;
    lastName?: ValidationFunction<string>;
    profilePic?: ValidationFunction<string>;
    address?: ValidationFunction<string>;
    landMark?: ValidationFunction<string>;
    phoneNumber?: ValidationFunction<string>;
    email?: ValidationFunction<string>;
    courierNIN?: ValidationFunction<string>;
    courierBVN?: ValidationFunction<string>;
    bankName?: ValidationFunction<string>;
    accountName?: ValidationFunction<string>;
    accountNumber?: ValidationFunction<string>;
    transportationType?: ValidationFunction<string>;
    vehicleType?: ValidationFunction<string>;
    model?: ValidationFunction<string>;
    plateNumber?: ValidationFunction<string>;
    maxiImages?: ValidationFunction<string>;
    maxiTransportPrice?: ValidationFunction<number>;
    guarantorName?: ValidationFunction<string>;
    guarantorLastName?: ValidationFunction<string>;
    guarantorProfession?: ValidationFunction<string>;
    guarantorNumber?: ValidationFunction<string>;
    guarantorRelationship?: ValidationFunction<string>;
    guarantorAddress?: ValidationFunction<string>;
    guarantorEmail?: ValidationFunction<string>;
    guarantorNIN?: ValidationFunction<string>;
    lat?: ValidationFunction<number>;
    lng?: ValidationFunction<number>;
    heading?: ValidationFunction<number>;
    push_token?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CourierCreateFormOverridesProps = {
    CourierCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    sub?: PrimitiveOverrideProps<TextFieldProps>;
    isOnline?: PrimitiveOverrideProps<SwitchFieldProps>;
    firstName?: PrimitiveOverrideProps<TextFieldProps>;
    lastName?: PrimitiveOverrideProps<TextFieldProps>;
    profilePic?: PrimitiveOverrideProps<TextFieldProps>;
    address?: PrimitiveOverrideProps<TextFieldProps>;
    landMark?: PrimitiveOverrideProps<TextFieldProps>;
    phoneNumber?: PrimitiveOverrideProps<TextFieldProps>;
    email?: PrimitiveOverrideProps<TextFieldProps>;
    courierNIN?: PrimitiveOverrideProps<TextFieldProps>;
    courierBVN?: PrimitiveOverrideProps<TextFieldProps>;
    bankName?: PrimitiveOverrideProps<TextFieldProps>;
    accountName?: PrimitiveOverrideProps<TextFieldProps>;
    accountNumber?: PrimitiveOverrideProps<TextFieldProps>;
    transportationType?: PrimitiveOverrideProps<TextFieldProps>;
    vehicleType?: PrimitiveOverrideProps<TextFieldProps>;
    model?: PrimitiveOverrideProps<TextFieldProps>;
    plateNumber?: PrimitiveOverrideProps<TextFieldProps>;
    maxiImages?: PrimitiveOverrideProps<TextFieldProps>;
    maxiTransportPrice?: PrimitiveOverrideProps<TextFieldProps>;
    guarantorName?: PrimitiveOverrideProps<TextFieldProps>;
    guarantorLastName?: PrimitiveOverrideProps<TextFieldProps>;
    guarantorProfession?: PrimitiveOverrideProps<TextFieldProps>;
    guarantorNumber?: PrimitiveOverrideProps<TextFieldProps>;
    guarantorRelationship?: PrimitiveOverrideProps<TextFieldProps>;
    guarantorAddress?: PrimitiveOverrideProps<TextFieldProps>;
    guarantorEmail?: PrimitiveOverrideProps<TextFieldProps>;
    guarantorNIN?: PrimitiveOverrideProps<TextFieldProps>;
    lat?: PrimitiveOverrideProps<TextFieldProps>;
    lng?: PrimitiveOverrideProps<TextFieldProps>;
    heading?: PrimitiveOverrideProps<TextFieldProps>;
    push_token?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CourierCreateFormProps = React.PropsWithChildren<{
    overrides?: CourierCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: CourierCreateFormInputValues) => CourierCreateFormInputValues;
    onSuccess?: (fields: CourierCreateFormInputValues) => void;
    onError?: (fields: CourierCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CourierCreateFormInputValues) => CourierCreateFormInputValues;
    onValidate?: CourierCreateFormValidationValues;
} & React.CSSProperties>;
export default function CourierCreateForm(props: CourierCreateFormProps): React.ReactElement;
