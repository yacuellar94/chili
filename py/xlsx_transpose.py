############################################################################
# Transpose Excel file to match the geoJson file
#  + And generate the species file : specie.json
############################################################################

#### Importation ####
# Pandas importation as the alias pd
import pandas as pd
# Os importation
import os
# Json importation
import json
# Unicodedate importation
import unicodedata

#### Variables declaration ####
# Excel imput folder
xls_input = './inputs/xls/'
# Excel output folder 
xls_output = './database/xls/'

#### Transpose function  ###
def transpose(filename, species):
    f = os.path.join(xls_input, filename)
    if os.path.isfile(f) and not filename.startswith('~') and (filename.endswith('.xlsx') or filename.endswith('.xls')):
        try:
            # Read the Excel file
            df_present = pd.read_excel(f)
            # Transpose the Excel file 
            ndf_trans = df_present.T
            # We fill every NaN with 0
            ndf_trans = ndf_trans.fillna(0.0)
            # We export the new transpose Excel file to the output folder 
            ndf_trans.to_excel(xls_output + filename)

            # Species list creation 
            # We define the first specie line as the 2nd line 
            df_fistCol = df_present.iloc[:, :1]
            idx = 0
            # We go through the first colum of the file to retriever all the species labels 
            for lg in df_fistCol.index:
                item = list(df_fistCol.loc[lg])[0]
                idx = idx + 1
                # We stop when we reach the line with the label All
                if item.upper().startswith('ALL'):
                    break

            liste = df_fistCol[0:idx - 1].values
            dic_espece = {}
            for item in liste:
                label = item[0]
                s_no_accents = ''.join((c for c in unicodedata.normalize('NFD', label) if unicodedata.category(c) != 'Mn'))
                specie = ''.join(s_no_accents.split())
                dic_espece[specie] = label

            # Add/replace region
            region = filename.split('.')[0]
            species[region] = dic_espece
            # We print a message everytime a new species list for a region is created 
            print('Especes: ' + region + ' Created !')
        # We print a message error if the operation doesn't work 
        except Exception as e:
            print('===> ERROR: failed to parse file', f, e)
    else:
        # If the Excel file is not valid we print a message
        print('===> Skip, Not a valid Excel file: ', f)


if __name__ == "__main__": 
    # Species dictionary
    species = {}
    # Species file
    filepath = './database/specie.json'
    filesize = os.path.getsize(filepath)
    if filesize > 0:
        # Opening JSON f/ile species
        f = open(filepath, 'r', encoding="utf-8")
        # returns JSON object as a dictionary
        species = json.load(f)
        f.close()
    
    for filename in os.listdir(xls_input):
        transpose(filename, species)

    # dump dictionary to json
    json_object = json.dumps(species, indent=4, ensure_ascii=False)

    # Writing to specie.json
    with open(filepath, "w", encoding="utf-8") as outfile:
        print('Create file')
        outfile.write(json_object)
