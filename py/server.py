
from genericpath import isfile
from http.server import BaseHTTPRequestHandler
import os, cgi, json
from py.utils import Utils

xls_indir      = 'inputs/xls'
in_geo_dir     = 'inputs/geojson'
specie_path    = 'database/specie.json'
reg_path       = 'database/region.json'

class Server(BaseHTTPRequestHandler):
    # # Initialise reading especes
    def load_especes(self): 
        especes        = {}
        # fichier des especes
        filepath = specie_path
        filesize = os.path.getsize(filepath)
        if filesize > 0:
            # Opening JSON f/ile especes
            f = open(filepath, 'r', encoding="utf-8")
            # returns JSON object as a dictionary
            especes = json.load(f)
            f.close()
        return especes

    # Initialise reading especes
    def save_species(self, species): 
        # dump dictionary to json
        json_object = json.dumps(species, indent=4, ensure_ascii=False)
        # Writing to region.json
        with open(specie_path, "w", encoding="utf-8") as outfile:
            print('Update specie file')
            outfile.write(json_object)

    def load_regions(self): 
        # Opening JSON file
        rf = open(reg_path, 'r', encoding="utf-8")
        # returns JSON object as a dictionary
        regions = json.load(rf)
        rf.close()
        return regions
    
    def save_regions(self, regions): 
         # dump dictionary to json
        json_object = json.dumps(regions, indent=4, ensure_ascii=False)
        # Writing to region.json
        with open(reg_path, "w", encoding="utf-8") as outfile:
            print('Update region file')
            outfile.write(json_object)

    def remove_files(self,filename):
        # Remove output xls file
        xls_out_path = 'database/xls/' + filename + '.xlsx'
        try:
            if os.path.isfile(xls_out_path):
                os.remove(xls_out_path)
        except:
            print('Failed to remove : ' + xls_out_path)
            
        # Remove output geojson file
        geo_out_path = 'database/geojson/' + filename + '.json'
        try:
            if os.path.isfile(geo_out_path):
                os.remove(geo_out_path)
        except:
            print('Failed to remove : ' + geo_out_path)

    # GET
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html' 
 
        try:
            split_path = os.path.splitext(self.path)
            request_extension = split_path[1]
            if request_extension != ".py":
                self.send_response(200)
                
                # Send image
                if request_extension == ".png" or request_extension == ".ico": 
                    if request_extension == ".ico":
                        self.send_header('Content-type','image/x-icon')
                    else:
                        self.send_header('Content-type','image/png')
                    
                    self.end_headers()
                    f = open(self.path[1:], 'rb').read()
                    self.wfile.write(f)
                
                # Send json
                elif request_extension == ".json" or request_extension == ".geojson": 
                    filepath = self.path[1:]
                    js = open(filepath, mode="r", encoding="utf-8").read() 
                    print('[Server] Load json file: ', filepath)
                    self.end_headers()
                    self.send_header('Content-type', 'application/json')
                    self.wfile.write(json.dumps(js).encode("utf-8"))  

                # Send anything
                else: 
                    filepath = self.path[1:]
                    f = open(filepath, mode="r", encoding="utf-8").read()
                    print('[Server] Load file: ', filepath)
                    self.end_headers() 
                    self.send_header('Content-type', 'text/html')
                    self.wfile.write(bytes(f, 'utf-8'))
            else:
                f = "!! ERROR - File not found " + self.path[1:]
                print(f)
                self.send_error(404, f)
        except:
            f = "    !! ERROR - on route: " + self.path[1:]
            print(f)
            self.send_error(404, f)

    """
    ################ POST ######################
    """
    def do_POST(self):
        form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={'REQUEST_METHOD':'POST', 'CONTENT_TYPE':self.headers['Content-Type'],})
       
        filename = form['filename'].value
        region_name = form['regionName'].value
        region_text = form['regionLabel'].value
        extension   = '.xlsx'
        # final excel filename   
        xfilename = ''

        if form['xlsfile'] is not None:
            xlsFile = form['xlsfile'].filename 
            data = form['xlsfile'].file.read()

            split_path = os.path.splitext(xlsFile)
            extension = split_path[1]

            filepath  = 'inputs/xls/' + filename + extension
            fout = open(filepath, "wb")
            fout.write(data)
            fout.close()

            # Save Excel filename
            xfilename = filename + extension

        if form['geofile']  is not None:
            gdata = form['geofile'].file.read()
            gfilepath  = 'inputs/geojson/' + filename + '.geojson'
            gfout = open(gfilepath, "wb")
            gfout.write(gdata)
            gfout.close()

        # Get the file prefix
        f = filename.split('.')[0] 
        # other file
        fp = '' 

        # Load utils functions       
        pyExcel = Utils()
        if extension == ".xlsx" or extension == ".xls": 
            pyExcel.transpose(xfilename, self.load_especes())
            # Search for geoJson file
            fp = 'inputs/geojson/' + f + '.geojson'
        
        elif extension == ".geojson": 
            xfilename = (f + '.xlsx')
             # Search for xls file 
            if not os.path.isfile('inputs/xls/' + xfilename):
                xfilename = (f + '.xls')
            fp = 'inputs/xls/' + xfilename

        # Check if Excel + geojson files exist => launch spatial join
        if fp != '' and os.path.isfile(fp):
            pyExcel.spatial_join(xfilename)

            # Load the reion file
            regions = self.load_regions()
            # Update region file if new 
            if regions.get(region_name) is None:
                # append the nex region
                regions[region_name] = region_text
                # save region
                self.save_regions(regions)
               
        
        # Respond with 200 OK  
        reply_mess = 'File ' + xfilename + ' Saved !'
        self.send_response(200, reply_mess)
        #self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(reply_mess.encode('utf-8'))
 
    """
    ################## DELETE ######################
    """
    def do_DELETE(self):
        self.log_message('==== Incoming DELETE request...')
        form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={'REQUEST_METHOD':'POST', 'CONTENT_TYPE':self.headers['Content-Type'],})
        type_delete = "Region "

        try:
            # Load species & region
            species = self.load_especes()
            regions = self.load_regions()
            # current rgion name
            region_name = ''
            reply_mess = ''
           
            if 'regionname' in form:
                # read the region name
                region_name = form['regionname'].value

                # Delete all period that start with region name
                for key in list(species.keys()):
                    if key.startswith(region_name):
                        del species[key]
                        # Remove database files
                        self.remove_files(key)

                # Save the species dictionary
                self.save_species(species)

            elif 'filename' in form:
                type_delete = "Period "
                # read the filename (period)
                filename = form['filename'].value
                self.log_message('Period Filename ' + filename)
                
                # If the filename in specie db
                if species.get(filename) is not None:
                    # Remove the file key
                    del species[filename]

                    # Save the species dictionary
                    self.save_species(species)

                    # Remove database files
                    self.remove_files(filename)
                else:
                    reply_mess = 'Specie '  + filename + ' does not exists !'
                    self.log_message(reply_mess)
                
                # Get the region name (del date of the filename)
                region_name = filename.split('_')[0] 
                # Check if all period of the region was not removed
                for period in list(species.keys()):
                    # If exist only 1 => do not remove
                    if period.startswith(region_name):
                        region_name = ''
                        break

            # Delete the region if has name
            if region_name != '' and regions.get(region_name) is not None:
                # Remove region
                del regions[region_name]
                # Save region
                self.save_regions(regions)

            # Respond with 200 OK  
            self.log_message('Delete ' + type_delete + ' SUCCESS!')

            # Response message 
            if reply_mess == '':
                reply_mess = type_delete + 'deleted successfully!'
            
            self.send_response(200, reply_mess) 
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(reply_mess.encode('utf-8'))
        
        except KeyError:
            self.send_response(404, self.path[2:])
            self.log_message("==> Incorrect parameters provided")
            self.send_error(404, "Incorrect parameters provided")
        except:
            err_mess = 'Failed to delete ' + type_delete
            self.send_error(404, err_mess)
            self.log_message(err_mess) 
            