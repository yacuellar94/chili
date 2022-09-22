#################################################################################
# Allow to do a spatial join between the geoJSON file and the xls file
##################################################################################

### Importation ###
# Pandas importation as the alias pd
import pandas as pd
# Geopandas importation as the alias gpd
import geopandas as gpd
# Os importation
import os

### Variable declaration ###
# Imput geoJson file
geo_input    =  './inputs/geojson/'
# Output xls file
xls_output   =  './database/xls/'
# Output geoJsonfile
geo_output   =  './database/geojson/'

# Spetial join function 
def create_geojson(filename):  
    # Read the Excel transpose/output file
    df_excel = pd.read_excel(xls_output + filename, skiprows = 1)
    # Read the geojson input file
    geo_filename = filename.split('.')[0]
    geo_file = geo_input + geo_filename + '.geojson'
    if os.path.isfile(geo_file):
        try:
            # Read the geojson
            sector = gpd.read_file(geo_file) 
            # We remove the NaN
            df_excel.fillna(0.0)
            # Spatial Join
            sector_join = sector.merge(df_excel, left_on='id', right_on='Sector')
            # Create the new Json file
            geo_out = geo_output + geo_filename + '.json'
            sector_join.to_file(geo_out, driver='GeoJSON')
        except Exception as e:
            # We write a message if the operation failed 
            print('===> ERROR: failed to parse file', f, e)
    else:
        # If a file is missing we write a message 
        print('====> WARNING !!! file not found :', geo_file)

if __name__ == "__main__":
    # cwd = os.getcwd()
    # os.chdir('../')
    # cwd1 = os.getcwd()
    for filename in os.listdir(xls_output):
        f = os.path.join(xls_output, filename)
        if os.path.isfile(f):
            # We check the extension of the file (must be an excel)
            split_path = os.path.splitext(f)
            file_extension = split_path[1]
            # We generate the join geojson 
            if file_extension == '.xlsx' or file_extension == '.xls':
                create_geojson(filename)
