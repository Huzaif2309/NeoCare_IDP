# app/model/preprocess.py

import pandas as pd
from sklearn.impute import SimpleImputer

categorical_cols = ['gender', 'feeding_type', 'immunizations_done', 'reflexes_normal']

def preprocess_input(data: dict, scaler):
    df = pd.DataFrame([data])

    # drop unused
    df = df.drop(['baby_id', 'name', 'date'], axis=1)

    # impute
    imputer = SimpleImputer(strategy='mean')
    df['apgar_score'] = imputer.fit_transform(df[['apgar_score']])

    # one-hot encode
    df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

    # align columns
    df = df.reindex(columns=scaler.feature_names_in_, fill_value=0)

    # scale
    df_scaled = scaler.transform(df)

    return df_scaled