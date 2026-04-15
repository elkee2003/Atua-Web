/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type WalletCreateFormInputValues = {
    ownerID?: string;
    ownerType?: string;
    balance?: number;
    pendingBalance?: number;
    totalEarnings?: number;
};
export declare type WalletCreateFormValidationValues = {
    ownerID?: ValidationFunction<string>;
    ownerType?: ValidationFunction<string>;
    balance?: ValidationFunction<number>;
    pendingBalance?: ValidationFunction<number>;
    totalEarnings?: ValidationFunction<number>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type WalletCreateFormOverridesProps = {
    WalletCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    ownerID?: PrimitiveOverrideProps<TextFieldProps>;
    ownerType?: PrimitiveOverrideProps<SelectFieldProps>;
    balance?: PrimitiveOverrideProps<TextFieldProps>;
    pendingBalance?: PrimitiveOverrideProps<TextFieldProps>;
    totalEarnings?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type WalletCreateFormProps = React.PropsWithChildren<{
    overrides?: WalletCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: WalletCreateFormInputValues) => WalletCreateFormInputValues;
    onSuccess?: (fields: WalletCreateFormInputValues) => void;
    onError?: (fields: WalletCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: WalletCreateFormInputValues) => WalletCreateFormInputValues;
    onValidate?: WalletCreateFormValidationValues;
} & React.CSSProperties>;
export default function WalletCreateForm(props: WalletCreateFormProps): React.ReactElement;
