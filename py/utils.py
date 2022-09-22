

import os
import pandas as pd 
import geopandas as gpd
import json
import unicodedata

espece_file = 'database/specie.json'
xls_input  = 'inputs/xls/'
xls_output = 'database/xls/'

geo_input    =  'inputs/geojson/'
xls_output   =  'database/xls/'
geo_output   =  'database/geojson/'

class Utils():

    def transpose(self, filename, especes):
        f = os.path.join(xls_input, filename)
        if os.path.isfile(f) and not filename.startswith('~') and (filename.endswith('.xlsx') or filename.endswith('.xls')):
            try:
                # Traspose du fichier Excel
                df_present = pd.read_excel(f)
                ndf_trans = df_present.T
                ndf_trans = ndf_trans.fillna(0.0)
                ndf_trans.to_excel(xls_output + filename)

                # Creation de l'espece
                if especes is not None:
                    df_fistCol = df_present.iloc[:, :1]
                    idx = 0
                    for lg in df_fistCol.index:
                        item = str(list(df_fistCol.loc[lg])[0])
                        idx = idx + 1
                        #if "Total" == item or "total" == item or "TOTAL" == item:
                        if item.upper().startswith('TOTAL'):
                            break

                    liste = df_fistCol[0:idx - 1].values
                    dic_espece = {}
                    for item in liste:
                        label = item[0]
                        s_no_accents = ''.join((c for c in unicodedata.normalize('NFD', label) if unicodedata.category(c) != 'Mn'))
                        espece = ''.join(s_no_accents.split())
                        dic_espece[espece] = label

                    # Update Especes
                    region = filename.split('.')[0]
                    especes[region] = dic_espece
        
                    # print('Especes: ' + region + ' Created !')
                    # dump dictionary to json
                    json_object = json.dumps(especes, indent=4, ensure_ascii=False) 
                    # Writing to espece.json
                    with open(espece_file, "w", encoding="utf-8") as outfile:
                        print('Create file')
                        outfile.write(json_object)

            except Exception as e:
                print('===> ERROR: failed to parse file', f, e)
                raise Exception('failed to parse file: ' + f)
        else:
            raise Exception('Not a valid Excel file:' + f)

    def spatial_join(self, filename):  
        df_excel = pd.read_excel(xls_output + filename, skiprows = 1)
        # Read the geo json input file
        geo_filename = filename.split('.')[0]
        geo_file = geo_input + geo_filename + '.geojson'
        if os.path.isfile(geo_file): 
            try:
                # lire le geojson
                sector = gpd.read_file(geo_file) 
                # On enleve les NaN
                df_excel.fillna(0.0)
                # Jointure
                sector_join = sector.merge(df_excel, left_on='id', right_on='Sector')
                # Crer le fichier json
                geo_out = geo_output + geo_filename + '.json'
                # On ecrit dans le ficher json
                sector_join.to_file(geo_out, driver='GeoJSON')
            except Exception as e:
                print('===> ERROR: failed to parse file', geo_file, e)
                raise Exception('Failed to parse Excel Json: ' + geo_file)
        else:
            print('====> WARNING !!! file not found :', geo_file)
            raise Exception('File not found ' + geo_file)

# ================================= END Class ====================================== #
