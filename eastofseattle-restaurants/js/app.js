$(document).ready(function( ){


  $("#filterByCity").val("ISSAQUAH")
  var baseURL = 'https://data.kingcounty.gov/resource/f29f-zza5.json?';
  var filterCity = $("#filterByCity").val();
  var filterCityTitleCase = filterCity.slice(0, 1).toUpperCase() + filterCity.slice(1).toLowerCase()
  console.log(filterCityTitleCase)
  var queryParams = '$select=program_identifier,city,address,business_id,max(inspection_date) as latest&$group=business_id,program_identifier,city,address&$having=latest>"2006-01-01T00:00:00.000"&$order=latest DESC&$where=city=' + "'" + filterCity + "'" + 'or city=' + "'" + filterCityTitleCase + "'" + '&$limit=10000&$$app_token=XqjnZS9RYSz34XpV3LG027xSI';

    /*var baseURL = 'https://data.kingcounty.gov/resource/f29f-zza5.json?'
    var filterCity = $("#filterByCity").val()
    var queryParams = '$select=name,city,address,business_id&$group=business_id,name,city,address&$order=:id&$where=city=' + "'" + filterCity + "'" + '&$$app_token=XqjnZS9RYSz34XpV3LG027xSI'*/

    var facilitiesTable = $("#facilities").DataTable({
            "responsive":true,
            "drawCallback": function(){
              pymChild.sendHeight();
              ga('send', 'pageview', 'http://www.eastofseattle.news/news/inspections/');
            },
            "rowCallback": function( row, data, index ){
              /*console.log(data.business_id)*/
                $("a.get-details-btn", row).attr("id", data.business_id)
            },

            "ajax": {
                "url": baseURL + queryParams,
                "dataType": "json",
                "dataSrc":"",
                "cache": "true"
            },
            "columns": [
                {
                    "data":"business_id",
                    "class": "hide_me"
                },
                {
                    "data":"program_identifier",
                    "class":"facility"
                },
                {
                    "orderable": false,
                    "data": null,
                    "defaultContent": '<a class="btn btn-default btn-xs get-details-btn">View Details</a>'
                },
                {
                  "data":"address",
                  "class":"address"
                },
                {
                  "data":"latest",
                  "class":"city",
                  "render": function(data){
                    return data.slice(0,10);
                  }
                }
            ],
            "order":  [[4, 'desc']]
        })

        $("#facilities").on('click', '.get-details-btn', getDetails);

        $('#getCity').click(function(){
          filterCity = $("#filterByCity").val();
          var filterCityTitleCase = filterCity.slice(0, 1).toUpperCase() + filterCity.slice(1).toLowerCase()
          //queryParams = '$select=program_identifier,city,address,business_id&$group=business_id,program_identifier,city,address&$order=program_identifier DESC&$where=city=' + "'" + filterCity + "'" + '&$limit=10000&$$app_token=XqjnZS9RYSz34XpV3LG027xSI';

          var queryParams = '$select=program_identifier,city,address,business_id,max(inspection_date) as latest&$group=business_id,program_identifier,city,address&$having=latest>"2006-01-01T00:00:00.000"&$order=latest DESC&$where=city=' + "'" + filterCity + "'" + 'or city=' + "'" + filterCityTitleCase + "'" + '&$limit=10000&$$app_token=XqjnZS9RYSz34XpV3LG027xSI';


          var newDataURL = baseURL + queryParams;
          var table = $('#facilities').DataTable()
                          .clear()
                          .ajax.url( newDataURL ).load();
          ga('send', 'pageview', 'http://www.eastofseattle.news/news/inspections/')
          });


          function hideTable(){
          	$("#facilitiesTable").css("display", "none");
          };

          function showTable(){
          	$("#facilities_panel").css("display", "block");
          	$("#details_row").css("display", "none");
          };

          function showDetailsPanel(){
          	$("#details_row").css("display", "block")
          	$("#facilities_panel").css("display", "none");
          };



          function getDetails(){
          	/*console.log(this)*/
            showDetailsPanel();
          	var bizID = this.id
            var restaurantName = $(this).parent().siblings( ".facility" ).html()
            var restaurantAddress = $(this).parent().siblings( ".address" ).html()
            var restaurantCity = $("#filterByCity").val()
            var restaurantInfo = {"name": restaurantName, "address": restaurantAddress, "city": restaurantCity}
            //console.log(restaurantName, restaurantAddress, restaurantCity)
          	var appKey = "$$app_token=XqjnZS9RYSz34XpV3LG027xSI"
          	var bizURL = "https://data.kingcounty.gov/resource/f29f-zza5.json?$select=inspection_serial_num,inspection_type,inspection_result,inspection_date,inspection_score,inspection_closed_business&$group=inspection_serial_num,inspection_type,inspection_result,inspection_date,inspection_score,inspection_closed_business&$order=inspection_date DESC&$where=business_id=%27" + bizID + "%27&" + appKey

            $.ajax({
          		dataType: "json",
          		url: bizURL,
          		success: function(data, status, jqXHR){
                var inspectionsRecords = []
                for (i = 0; i < data.length; i++){
                    var inspection = {}
                    var record = data[i]
                    //console.log(record)
                    var inspectionDate = record["inspection_date"]
                    inspectionDate = inspectionDate.slice(0, 10)
                    //console.log(inspectionDate)
                    inspection["inspection_date"] = inspectionDate;
                    inspection["inspection_result"] = record["inspection_result"]
                    inspection["inspection_type"] = record["inspection_type"]
                    inspection["inspection_score"] = record["inspection_score"]
                    inspection["inspection_serial_num"] = record["inspection_serial_num"]
                    if (record["inspection_closed_business"] == true){
                      inspection["inspection_closed_business"] = true;
                    } else {inspection["inspection_closed_business"] = null}
                    //inspection["inspection_closed_business"] = record["inspection_closed_business"]
                    inspection["violations"] = false
                    if (record["inspection_score"] > 0 ){
                      inspection["violations"] = true;
                    }
                    console.log(inspection)
                    inspectionsRecords.push(inspection)
                }/*end loop*/
                restaurantInfo["inspections"] = inspectionsRecords
                var inspectionsScript = $("#inspections-template").html();
                var inspectionsTemplate = Handlebars.compile(inspectionsScript);
                $("#details_row").html(inspectionsTemplate(restaurantInfo))
                $('.get-violations-button').on('click', getViolations);
                //$("#details_row").on('click', '.get-violations-button', getViolations);
                $("#details_row").on('click', '.return-to-table', showTable);

                },/*end success handler*/
              complete: function(){
                pymChild.sendHeight();
                ga('send', 'pageview', 'http://www.eastofseattle.news/news/inspections/');
              }/*end completeHandler */
              })/*end ajax call*/
            };/*end getDetails function*/

            function hideViolations(elementID){
              //console.log(this)
              $("div#" + elementID).remove()
              $("a#" + elementID).on("click", getViolations)
                .html("Show Violations")
            }

            function getViolations(){

              var inspectionID = this.id;


              //$(this).html("Hide Violations")
              //$("#details_row").off('click', '.get-violations-button', getViolations)

              var divString = "<div class='col-xs-12' id='" + inspectionID + "'></div>"
              $(this).parent().parent().append(divString)
              var appKey = "$$app_token=XqjnZS9RYSz34XpV3LG027xSI"
              var violationURL =
              "https://data.kingcounty.gov/resource/f29f-zza5.json?$select=violation_type,violation_description,violation_points&$where=inspection_serial_num=%27" + inspectionID + "%27&" + appKey

              $.ajax({
                dataType: "json",
                url: violationURL,

                success: function(data, status, jqXHR){
                  var violationRecords = {"violations": data}
                  var violationsScript = $("#violations-template").html();
                  var violationsTemplate = Handlebars.compile(violationsScript);
                  $("div#" + inspectionID ).html(violationsTemplate(violationRecords));
                },
                complete: function(){
                  pymChild.sendHeight();
                  ga('send', 'pageview', 'http://www.eastofseattle.news/news/inspections/')
                }

                })/*end ajax call*/
                $(this).unbind('click').click(function(){
                  hideViolations(inspectionID)
                })
                  .html('Hide Violations')


              }/*end getViolations*/

          });/*end document ready*/




/*buildTable();
*/