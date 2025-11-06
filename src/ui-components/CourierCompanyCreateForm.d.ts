/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type CourierCompanyCreateFormInputValues = {
    sub?: string;
    firstName?: string;
    lastName?: string;
    profilePic?: string;
    address?: string;
    lat?: number;
    lng?: number;
    landmark?: string;
    phoneNumber?: string;
    email?: string;
    adminFirstName?: string;
    adminLastName?: string;
    adminPhoneNumber?: string;
    bankName?: string;
    accountNumber?: string;
    push_token?: string;
};
export declare type CourierCompanyCreateFormValidationValues = {
    sub?: ValidationFunction<string>;
    firstName?: ValidationFunction<string>;
    lastName?: ValidationFunction<string>;
    profilePic?: ValidationFunction<string>;
    address?: ValidationFunction<string>;
    lat?: ValidationFunction<number>;
    lng?: ValidationFunction<number>;
    landmark?: ValidationFunction<string>;
    phoneNumber?: ValidationFunction<string>;
    email?: ValidationFunction<string>;
    adminFirstName?: ValidationFunction<string>;
    adminLastName?: ValidationFunction<string>;
    adminPhoneNumber?: ValidationFunction<string>;
    bankName?: ValidationFunction<string>;
    accountNumber?: ValidationFunction<string>;
    push_token?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CourierCompanyCreateFormOverridesProps = {
    CourierCompanyCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    sub?: PrimitiveOverrideProps<TextFieldProps>;
    firstName?: PrimitiveOverrideProps<TextFieldProps>;
    lastName?: PrimitiveOverrideProps<TextFieldProps>;
    profilePic?: PrimitiveOverrideProps<TextFieldProps>;
    address?: PrimitiveOverrideProps<TextFieldProps>;
    lat?: PrimitiveOverrideProps<TextFieldProps>;
    lng?: PrimitiveOverrideProps<TextFieldProps>;
    landmark?: PrimitiveOverrideProps<TextFieldProps>;
    phoneNumber?: PrimitiveOverrideProps<TextFieldProps>;
    email?: PrimitiveOverrideProps<TextFieldProps>;
    adminFirstName?: PrimitiveOverrideProps<TextFieldProps>;
    adminLastName?: PrimitiveOverrideProps<TextFieldProps>;
    adminPhoneNumber?: PrimitiveOverrideProps<TextFieldProps>;
    bankName?: PrimitiveOverrideProps<TextFieldProps>;
    accountNumber?: PrimitiveOverrideProps<TextFieldProps>;
    push_token?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CourierCompanyCreateFormProps = React.PropsWithChildren<{
    overrides?: CourierCompanyCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: CourierCompanyCreateFormInputValues) => CourierCompanyCreateFormInputValues;
    onSuccess?: (fields: CourierCompanyCreateFormInputValues) => void;
    onError?: (fields: CourierCompanyCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CourierCompanyCreateFormInputValues) => CourierCompanyCreateFormInputValues;
    onValidate?: CourierCompanyCreateFormValidationValues;
} & React.CSSProperties>;
export default function CourierCompanyCreateForm(props: CourierCompanyCreateFormProps): React.ReactElement;
